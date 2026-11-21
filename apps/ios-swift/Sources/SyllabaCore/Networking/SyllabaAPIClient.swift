import Foundation

public enum SyllabaAPIError: LocalizedError, Sendable {
    case invalidURL
    case httpError(statusCode: Int, message: String)
    case decodingFailed

    public var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid Syllaba API endpoint."
        case let .httpError(code, message):
            return "Server returned HTTP \(code): \(message)"
        case .decodingFailed:
            return "Unable to decode agent JSON response."
        }
    }
}

public protocol SyllabaAPIClientProtocol: Sendable {
    func extractSyllabus(text: String, courseTitle: String?) async throws -> SyllabusExtraction
    func planMicroTasks(extraction: SyllabusExtraction, syllabusText: String, dailyHoursLimit: Int) async throws -> Roadmap
    func curateResources(roadmapId: String, modules: [ExtractedModule]) async throws -> [CuratedResource]
    func reschedule(roadmap: Roadmap, delayDays: Int) async throws -> Roadmap
}

public actor SyllabaAPIClient: SyllabaAPIClientProtocol {
    private let baseURL: String
    private let session: URLSession
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    public init(
        baseURL: String = "https://syllaba.xyz",
        session: URLSession = .shared
    ) {
        self.baseURL = baseURL
        self.session = session
    }

    public func extractSyllabus(
        text: String,
        courseTitle: String? = nil
    ) async throws -> SyllabusExtraction {
        struct RequestBody: Encodable {
            let syllabusText: String
            let courseTitle: String?
        }
        struct ResponseBody: Decodable {
            let extraction: SyllabusExtraction
        }

        let response: ResponseBody = try await post(
            path: "/api/agents/extract",
            body: RequestBody(syllabusText: text, courseTitle: courseTitle)
        )
        return response.extraction
    }

    public func planMicroTasks(
        extraction: SyllabusExtraction,
        syllabusText: String,
        dailyHoursLimit: Int = 2
    ) async throws -> Roadmap {
        struct RequestBody: Encodable {
            let extraction: SyllabusExtraction
            let syllabusText: String
            let dailyHoursLimit: Int
            let includeRestDays: Bool
        }
        struct ResponseBody: Decodable {
            let roadmap: Roadmap
        }

        let response: ResponseBody = try await post(
            path: "/api/agents/plan",
            body: RequestBody(
                extraction: extraction,
                syllabusText: syllabusText,
                dailyHoursLimit: dailyHoursLimit,
                includeRestDays: true
            )
        )
        return response.roadmap
    }

    public func curateResources(
        roadmapId: String,
        modules: [ExtractedModule]
    ) async throws -> [CuratedResource] {
        struct RequestBody: Encodable {
            let roadmapId: String
            let modules: [ExtractedModule]
        }
        struct ResponseBody: Decodable {
            let resources: [CuratedResource]
        }

        let response: ResponseBody = try await post(
            path: "/api/agents/curate",
            body: RequestBody(roadmapId: roadmapId, modules: modules)
        )
        return response.resources
    }

    public func reschedule(roadmap: Roadmap, delayDays: Int = 2) async throws -> Roadmap {
        struct RequestBody: Encodable {
            let roadmap: Roadmap
            let delayDays: Int
            let reason: String
        }
        struct ResponseBody: Decodable {
            let roadmap: Roadmap
        }

        let response: ResponseBody = try await post(
            path: "/api/roadmap/reschedule",
            body: RequestBody(
                roadmap: roadmap,
                delayDays: delayDays,
                reason: "iOS adaptive catch-up"
            )
        )
        return response.roadmap
    }

    private func post<Request: Encodable, Response: Decodable>(
        path: String,
        body: Request
    ) async throws -> Response {
        guard let url = URL(string: "\(baseURL)\(path)") else {
            throw SyllabaAPIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try encoder.encode(body)

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw SyllabaAPIError.httpError(statusCode: -1, message: "No HTTP response")
        }
        guard (200...299).contains(http.statusCode) else {
            let text = String(data: data, encoding: .utf8) ?? ""
            throw SyllabaAPIError.httpError(statusCode: http.statusCode, message: text)
        }

        do {
            return try decoder.decode(Response.self, from: data)
        } catch {
            throw SyllabaAPIError.decodingFailed
        }
    }
}

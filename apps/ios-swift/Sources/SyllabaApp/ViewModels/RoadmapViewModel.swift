import Foundation
import Observation
import SyllabaCore

@Observable
@MainActor
public final class RoadmapViewModel {
    public enum ViewState: Equatable {
        case idle
        case loading(stage: String)
        case error(String)
    }

    private let apiClient: SyllabaAPIClientProtocol

    public var state: ViewState = .idle
    public var account: StudentAccount?
    public var language: AppLanguage = .en
    public var roadmaps: [Roadmap] = []
    public var activeRoadmapId: String?

    public var activeRoadmap: Roadmap? {
        if let activeRoadmapId, let found = roadmaps.first(where: { $0.id == activeRoadmapId }) {
            return found
        }
        return roadmaps.first
    }

    public init(apiClient: SyllabaAPIClientProtocol = SyllabaAPIClient()) {
        self.apiClient = apiClient
    }

    public func signIn(name: String, email: String) {
        let cleanName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        let resolvedName = cleanName.isEmpty ? "Scholar" : cleanName
        let handlePrefix = email.split(separator: "@").first.map(String.init) ?? resolvedName.lowercased()
        let shortId = String(UUID().uuidString.prefix(6))
        account = StudentAccount(
            id: "ID #\(shortId)",
            fullName: resolvedName,
            username: "@\(handlePrefix)",
            email: email
        )
    }

    public func signOut() {
        account = nil
    }

    public func generateRoadmap(from syllabusText: String, dailyHours: Int = 2) async {
        guard !syllabusText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return
        }

        state = .loading(stage: language == .id ? "Agent 1: Mengekstrak modul..." : "Agent 1: Extracting modules...")
        do {
            let extraction = try await apiClient.extractSyllabus(text: syllabusText, courseTitle: nil)

            state = .loading(stage: language == .id ? "Agent 2 & 4: Menyusun micro-task 15-30m..." : "Agent 2 & 4: Planning 15-30m micro-tasks...")
            var roadmap = try await apiClient.planMicroTasks(
                extraction: extraction,
                syllabusText: syllabusText,
                dailyHoursLimit: dailyHours
            )

            state = .loading(stage: language == .id ? "Agent 3: Mengkurasi referensi OpenAlex..." : "Agent 3: Curating OpenAlex resources...")
            if let resources = try? await apiClient.curateResources(roadmapId: roadmap.id, modules: extraction.modules) {
                roadmap.curatedResources = resources
            }

            roadmaps.insert(roadmap, at: 0)
            activeRoadmapId = roadmap.id
            state = .idle
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    public func rescheduleActive(delayDays: Int = 2) async {
        guard let current = activeRoadmap else { return }
        state = .loading(stage: language == .id ? "Menata ulang jadwal..." : "Recalculating schedule...")
        do {
            let updated = try await apiClient.reschedule(roadmap: current, delayDays: delayDays)
            if let idx = roadmaps.firstIndex(where: { $0.id == updated.id }) {
                roadmaps[idx] = updated
            }
            activeRoadmapId = updated.id
            state = .idle
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    public func toggleTaskCompletion(taskId: String) {
        guard let current = activeRoadmap,
              let roadmapIdx = roadmaps.firstIndex(where: { $0.id == current.id }) else {
            return
        }

        var updated = current
        var totalCompleted = 0

        updated.dailySchedules = updated.dailySchedules.map { day in
            var copyDay = day
            copyDay.tasks = day.tasks.map { task in
                var copyTask = task
                if copyTask.id == taskId {
                    copyTask.isCompleted.toggle()
                }
                if copyTask.isCompleted {
                    totalCompleted += 1
                }
                return copyTask
            }
            return copyDay
        }

        updated.completedTasks = totalCompleted
        roadmaps[roadmapIdx] = updated
    }
}

import Foundation
import SwiftData

public enum CognitiveLoad: String, Codable, Sendable, CaseIterable {
    case light
    case moderate
    case deep
}

public enum TaskCategory: String, Codable, Sendable, CaseIterable {
    case reading
    case practice
    case research
    case writing
    case coding
    case review
}

public enum AppLanguage: String, Codable, Sendable, CaseIterable {
    case en
    case id
    case zh
    case ar
    case es
    case pt

    public var displayName: String {
        switch self {
        case .en: return "English (EN)"
        case .id: return "Bahasa Indonesia (ID)"
        case .zh: return "中文 Chinese (ZH)"
        case .ar: return "العربية Arabic (AR)"
        case .es: return "Español (ES)"
        case .pt: return "Português (PT)"
        }
    }
}

public struct Subtask: Identifiable, Codable, Hashable, Sendable {
    public let id: String
    public var title: String
    public var isCompleted: Bool

    public init(id: String, title: String, isCompleted: Bool = false) {
        self.id = id
        self.title = title
        self.isCompleted = isCompleted
    }
}

public struct RoadmapTask: Identifiable, Codable, Hashable, Sendable {
    public let id: String
    public var title: String
    public var description: String
    public var dayNumber: Int
    public var date: String
    public var estimatedMinutes: Int
    public var cognitiveLoad: CognitiveLoad
    public var category: TaskCategory
    public var isCompleted: Bool
    public var subtasks: [Subtask]
    public var resources: [String]?
    public var moduleTitle: String?
}

public struct DailySchedule: Identifiable, Codable, Hashable, Sendable {
    public var id: Int { dayNumber }
    public let dayNumber: Int
    public var date: String
    public var isRestDay: Bool
    public var totalEstimatedMinutes: Int
    public var cognitiveLoadSummary: CognitiveLoad
    public var tasks: [RoadmapTask]
}

public struct BurnoutMetrics: Codable, Hashable, Sendable {
    public var riskScore: Int
    public var riskLevel: String
    public var weeklyPeakHours: Double
    public var recommendedRestDays: Int
    public var burnoutFactors: [String]
}

public struct ExtractedModule: Codable, Hashable, Sendable {
    public var title: String
    public var topics: [String]
    public var weightPercentage: Double?
    public var deadlineHint: String?
    public var estimatedHours: Double?
}

public struct SyllabusExtraction: Codable, Hashable, Sendable {
    public var courseTitle: String
    public var courseCode: String?
    public var hardDeadline: String?
    public var modules: [ExtractedModule]
}

public struct CuratedResource: Identifiable, Codable, Hashable, Sendable {
    public let id: String
    public var roadmapId: String
    public var moduleTopic: String
    public var title: String
    public var url: String
    public var sourceType: String
    public var summary: String?
    public var year: Int?
}

public struct Roadmap: Identifiable, Codable, Hashable, Sendable {
    public let id: String
    public var courseTitle: String
    public var courseCode: String?
    public var targetEndDate: String
    public var startDate: String
    public var totalDays: Int
    public var totalTasks: Int
    public var completedTasks: Int
    public var dailySchedules: [DailySchedule]
    public var burnoutMetrics: BurnoutMetrics
    public var modulesSummary: [ExtractedModule]?
    public var curatedResources: [CuratedResource]?
    public var walletAddress: String?
    public var roadmapHash: String?
    public var createdAt: String
    public var updatedAt: String
}

public struct StudentAccount: Identifiable, Codable, Equatable, Sendable {
    public let id: String
    public var fullName: String
    public var username: String
    public var email: String
    public var walletAddress: String?

    public init(
        id: String,
        fullName: String,
        username: String,
        email: String,
        walletAddress: String? = nil
    ) {
        self.id = id
        self.fullName = fullName
        self.username = username
        self.email = email
        self.walletAddress = walletAddress
    }
}

@Model
public final class StoredRoadmapEntity {
    @Attribute(.unique) public var id: String
    public var courseTitle: String
    public var payloadData: Data
    public var updatedAt: Date

    public init(id: String, courseTitle: String, payloadData: Data, updatedAt: Date = .now) {
        self.id = id
        self.courseTitle = courseTitle
        self.payloadData = payloadData
        self.updatedAt = updatedAt
    }
}

import SwiftUI
import SyllabaCore

public enum SyllabaBrandColor {
    public static let inkBlack = Color(red: 0.067, green: 0.067, blue: 0.067)
    public static let yellowGold = Color(red: 0.980, green: 0.800, blue: 0.082)
    public static let yellowSoft = Color(red: 0.996, green: 0.953, blue: 0.780)
    public static let pureWhite = Color.white
    public static let alabaster = Color(red: 0.969, green: 0.969, blue: 0.961)
}

public enum IOSSidebarSection: Hashable, CaseIterable {
    case dashboard
    case history
    case settingsAccount
    case settingsLanguage
    case help
}

public struct SyllabaRootView: View {
    @State private var viewModel = RoadmapViewModel()
    @State private var selectedSection: IOSSidebarSection = .dashboard
    @State private var syllabusDraft: String = """
    Course: CS402 Distributed Systems & Web3 Consensus
    Week 1: CAP Theorem, Logical Clocks, Lamport Timestamps
    Week 2: Raft Consensus & Leader Election
    Week 3: EVM Execution, Reentrancy Guards & State Proofs
    """

    public init() {}

    public var body: some View {
        NavigationSplitView {
            sidebarContent
        } detail: {
            detailContent
        }
        .tint(SyllabaBrandColor.inkBlack)
    }

    private var sidebarContent: some View {
        List(selection: $selectedSection) {
            Section {
                HStack(spacing: 12) {
                    Circle()
                        .fill(SyllabaBrandColor.yellowGold)
                        .frame(width: 40, height: 40)
                        .overlay {
                            Text((viewModel.account?.fullName ?? "S").prefix(1))
                                .font(.headline.bold())
                                .foregroundStyle(SyllabaBrandColor.inkBlack)
                        }

                    VStack(alignment: .leading, spacing: 2) {
                        Text(viewModel.account?.fullName ?? "Scholar")
                            .font(.subheadline.bold())
                        Text(viewModel.account?.username ?? (viewModel.language == .id ? "Mode Tamu" : "Guest"))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 4)
            }

            Section(viewModel.language == .id ? "Menu" : "Workspace") {
                NavigationLink(value: IOSSidebarSection.dashboard) {
                    Label(viewModel.language == .id ? "Dasbor" : "Dashboard", systemImage: "square.grid.2x2")
                }
                NavigationLink(value: IOSSidebarSection.history) {
                    Label("History", systemImage: "clock.arrow.circlepath")
                }
            }

            Section("Setting") {
                NavigationLink(value: IOSSidebarSection.settingsAccount) {
                    Label("Account", systemImage: "person.crop.circle")
                }
                NavigationLink(value: IOSSidebarSection.settingsLanguage) {
                    Label("Language", systemImage: "globe")
                }
                NavigationLink(value: IOSSidebarSection.help) {
                    Label("Help / Contact Us", systemImage: "questionmark.circle")
                }
            }

            if viewModel.account != nil {
                Section {
                    Button(role: .destructive) {
                        viewModel.signOut()
                    } label: {
                        Label("Logout", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(.ultraThinMaterial)
        .navigationTitle("Syllaba")
    }

    @ViewBuilder
    private var detailContent: some View {
        switch selectedSection {
        case .dashboard:
            dashboardDetail
        case .history:
            historyDetail
        case .settingsAccount:
            accountDetail
        case .settingsLanguage:
            languageDetail
        case .help:
            helpDetail
        }
    }

    private var dashboardDetail: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("5-Agent Pipeline")
                            .font(.caption.bold())
                            .padding(.horizontal, 10)
                            .padding(.vertical, 4)
                            .background(SyllabaBrandColor.yellowGold)
                            .foregroundStyle(SyllabaBrandColor.inkBlack)
                            .clipShape(Capsule())

                        Text(
                            viewModel.language == .id
                                ? "Ubah Silabus Menjadi Sprint 15-30 Menit"
                                : "Turn Syllabi Into 15-30m Daily Sprints"
                        )
                        .font(.title3.bold())
                        .foregroundStyle(.white)

                        TextEditor(text: $syllabusDraft)
                            .frame(minHeight: 90)
                            .padding(8)
                            .scrollContentBackground(.hidden)
                            .background(Color.white.opacity(0.12))
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 12))

                        Button {
                            Task {
                                await viewModel.generateRoadmap(from: syllabusDraft)
                            }
                        } label: {
                            HStack {
                                if case let .loading(stage) = viewModel.state {
                                    ProgressView()
                                        .tint(SyllabaBrandColor.inkBlack)
                                    Text(stage)
                                } else {
                                    Image(systemName: "sparkles")
                                    Text(
                                        viewModel.language == .id
                                            ? "Buat Roadmap Belajar"
                                            : "Generate Verified Roadmap"
                                    )
                                }
                            }
                            .font(.subheadline.bold())
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(SyllabaBrandColor.yellowGold)
                            .foregroundStyle(SyllabaBrandColor.inkBlack)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }
                    .padding(16)
                    .background(SyllabaBrandColor.inkBlack)
                    .clipShape(RoundedRectangle(cornerRadius: 20))

                    if let roadmap = viewModel.activeRoadmap {
                        HStack {
                            VStack(alignment: .leading) {
                                Text(roadmap.courseTitle)
                                    .font(.headline.bold())
                                Text("\(roadmap.completedTasks)/\(roadmap.totalTasks) completed")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            Button {
                                Task {
                                    await viewModel.rescheduleActive()
                                }
                            } label: {
                                Label("Catch Up", systemImage: "arrow.triangle.2.circlepath")
                                    .font(.caption.bold())
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .background(SyllabaBrandColor.yellowSoft)
                                    .foregroundStyle(SyllabaBrandColor.inkBlack)
                                    .clipShape(Capsule())
                            }
                        }

                        ForEach(roadmap.dailySchedules.flatMap(\.tasks)) { task in
                            Button {
                                viewModel.toggleTaskCompletion(taskId: task.id)
                            } label: {
                                HStack(alignment: .top, spacing: 12) {
                                    Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
                                        .foregroundStyle(task.isCompleted ? SyllabaBrandColor.inkBlack : .secondary)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(task.title)
                                            .font(.subheadline.bold())
                                            .foregroundStyle(SyllabaBrandColor.inkBlack)
                                            .strikethrough(task.isCompleted)
                                        Text("Day \(task.dayNumber) · \(task.estimatedMinutes)m · \(task.cognitiveLoad.rawValue)")
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                }
                                .padding(14)
                                .background(SyllabaBrandColor.pureWhite)
                                .clipShape(RoundedRectangle(cornerRadius: 14))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 14)
                                        .stroke(Color.black.opacity(0.08), lineWidth: 1)
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding()
            }
            .background(SyllabaBrandColor.alabaster)
            .navigationTitle("Dashboard")
        }
    }

    private var historyDetail: some View {
        NavigationStack {
            List(viewModel.roadmaps) { roadmap in
                Button {
                    viewModel.activeRoadmapId = roadmap.id
                    selectedSection = .dashboard
                } label: {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(roadmap.courseTitle)
                            .font(.headline)
                        Text("\(roadmap.completedTasks)/\(roadmap.totalTasks) completed · \(roadmap.totalDays) days")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .overlay {
                if viewModel.roadmaps.isEmpty {
                    ContentUnavailableView(
                        "No Study History",
                        systemImage: "book.closed",
                        description: Text("Generate a roadmap on the Dashboard tab to track your sessions.")
                    )
                }
            }
            .navigationTitle("History")
        }
    }

    private var accountDetail: some View {
        NavigationStack {
            Form {
                if let account = viewModel.account {
                    Section("Profile") {
                        LabeledContent("Name", value: account.fullName)
                        LabeledContent("ID", value: account.id)
                        LabeledContent("Username", value: account.username)
                        LabeledContent("Email", value: account.email)
                    }
                    Section {
                        Button("Logout", role: .destructive) {
                            viewModel.signOut()
                        }
                    }
                } else {
                    Section("Login") {
                        Button("Sign In Demo Account") {
                            viewModel.signIn(name: "Salman", email: "salman@syllaba.xyz")
                        }
                    }
                }
            }
            .navigationTitle("Account")
        }
    }

    private var languageDetail: some View {
        NavigationStack {
            Form {
                Picker("Interface Language", selection: $viewModel.language) {
                    Text("English (EN)").tag(AppLanguage.en)
                    Text("Bahasa Indonesia (ID)").tag(AppLanguage.id)
                }
                .pickerStyle(.inline)
            }
            .navigationTitle("Language")
        }
    }

    private var helpDetail: some View {
        NavigationStack {
            List {
                Section("Support") {
                    LabeledContent("Team", value: "Team ITSPIRIT")
                    LabeledContent("Email", value: "support@syllaba.xyz")
                    LabeledContent("Web", value: "https://syllaba.xyz")
                }
                Section("FAQ") {
                    Text("Syllaba decomposes course syllabi into 15-30 minute micro-tasks and anchors proof hashes on Base Sepolia (84532).")
                        .font(.footnote)
                }
            }
            .navigationTitle("Help / Contact Us")
        }
    }
}

import SwiftData
import SwiftUI
import SyllabaApp
import SyllabaCore

@main
struct SyllabaMobileApp: App {
    var body: some Scene {
        WindowGroup {
            SyllabaRootView()
        }
        .modelContainer(for: PersistedRoadmap.self)
    }
}

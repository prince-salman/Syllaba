import Foundation
import Testing
@testable import SyllabaCore
@testable import SyllabaApp

struct SyllabaModelTests {
    @Test("Decodes SyllabusExtraction JSON from backend")
    func testExtractionDecoding() throws {
        let json = """
        {
          "courseTitle": "CS402 Distributed Systems",
          "courseCode": "CS402",
          "hardDeadline": "2026-12-05",
          "modules": [
            {
              "title": "Week 1: Raft Consensus",
              "topics": ["Leader Election", "Log Replication"],
              "estimatedHours": 3
            }
          ]
        }
        """.data(using: .utf8)!

        let decoded = try JSONDecoder().decode(SyllabusExtraction.self, from: json)
        #expect(decoded.courseTitle == "CS402 Distributed Systems")
        #expect(decoded.modules.count == 1)
    }

    @Test("Account login and language switch on RoadmapViewModel")
    @MainActor
    func testViewModelAccountAndLanguage() {
        let vm = RoadmapViewModel()
        #expect(vm.account == nil)
        vm.signIn(name: "Salman", email: "salman@syllaba.xyz")
        #expect(vm.account?.username == "@salman")
        vm.language = .id
        #expect(vm.language == .id)
        vm.signOut()
        #expect(vm.account == nil)
    }
}

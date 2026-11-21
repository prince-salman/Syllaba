// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "SyllabaIOS",
    platforms: [
        .iOS(.v17),
        .macOS(.v14),
    ],
    products: [
        .library(
            name: "SyllabaCore",
            targets: ["SyllabaCore"]
        ),
        .library(
            name: "SyllabaApp",
            targets: ["SyllabaApp"]
        ),
    ],
    targets: [
        .target(
            name: "SyllabaCore",
            swiftSettings: [
                .enableExperimentalFeature("StrictConcurrency"),
            ]
        ),
        .target(
            name: "SyllabaApp",
            dependencies: ["SyllabaCore"],
            swiftSettings: [
                .enableExperimentalFeature("StrictConcurrency"),
            ]
        ),
        .testTarget(
            name: "SyllabaIOSTests",
            dependencies: ["SyllabaCore", "SyllabaApp"]
        ),
    ]
)

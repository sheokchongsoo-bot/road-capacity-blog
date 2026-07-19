plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "kr.re.ii.oimarket"
    compileSdk = 35

    defaultConfig {
        applicationId = "kr.re.ii.oimarket"
        minSdk = 26          // Android 8.0+ (적응형 아이콘·모던 WebView)
        targetSdk = 34
        versionCode = 1
        versionName = "0.1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        buildConfig = false
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("androidx.core:core-splashscreen:1.0.1")
}

// 빌드 시 프로토타입(../../app)의 런타임 자산을 assets/www 로 자동 동기화.
// 단일 소스(app/) 유지 — 자산 사본을 git 에 커밋하지 않는다.
val syncWebAssets by tasks.registering(Copy::class) {
    val webRoot = rootProject.projectDir.resolveSibling("app")
    from(webRoot) {
        include("index.html", "manifest.webmanifest", "sw.js", "css/**", "js/**", "icons/**")
    }
    into(layout.projectDirectory.dir("src/main/assets/www"))
}
tasks.named("preBuild") { dependsOn(syncWebAssets) }


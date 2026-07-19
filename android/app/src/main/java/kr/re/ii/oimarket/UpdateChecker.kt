package kr.re.ii.oimarket

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.appcompat.app.AlertDialog
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * 사내 버전 확인(#3) — 인트라넷의 version.json 을 조회해 새 버전이 있으면
 * 알림 대화상자를 띄우고, "업데이트"를 누르면 APK 주소를 열어 설치로 이어준다.
 *
 * version.json 예:
 * {
 *   "versionCode": 2,
 *   "versionName": "0.2.0",
 *   "apkUrl": "https://intra.ii.re.kr/apps/oimarket/oimarket-0.2.0.apk",
 *   "notes": "버그 수정 및 개선"
 * }
 *
 * update_manifest_url(res/values/config.xml)이 비어 있으면 아무 것도 하지 않는다.
 * 네트워크 실패(오프라인 등)는 조용히 무시한다.
 */
object UpdateChecker {

    fun check(activity: Activity) {
        val url = activity.getString(R.string.update_manifest_url).trim()
        if (url.isEmpty()) return

        Thread {
            try {
                val obj = JSONObject(fetch(url))
                val latest = obj.getLong("versionCode")
                if (latest > currentVersionCode(activity)) {
                    val name = obj.optString("versionName", "")
                    val apkUrl = obj.optString("apkUrl", "")
                    val notes = obj.optString("notes", "")
                    if (apkUrl.isNotEmpty()) {
                        activity.runOnUiThread {
                            if (!activity.isFinishing) prompt(activity, name, apkUrl, notes)
                        }
                    }
                }
            } catch (_: Exception) {
                // 조용히 무시 (네트워크 불가/파싱 실패 등)
            }
        }.start()
    }

    private fun currentVersionCode(activity: Activity): Long {
        val pi = activity.packageManager.getPackageInfo(activity.packageName, 0)
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            pi.longVersionCode
        } else {
            @Suppress("DEPRECATION")
            pi.versionCode.toLong()
        }
    }

    private fun fetch(urlStr: String): String {
        val conn = (URL(urlStr).openConnection() as HttpURLConnection).apply {
            connectTimeout = 6000
            readTimeout = 6000
            requestMethod = "GET"
        }
        try {
            return conn.inputStream.bufferedReader().use { it.readText() }
        } finally {
            conn.disconnect()
        }
    }

    private fun prompt(activity: Activity, name: String, apkUrl: String, notes: String) {
        val title = if (name.isNotEmpty()) "새 버전 $name 있어요" else "새 버전 안내"
        val msg = if (notes.isNotEmpty()) notes else "새로운 버전이 있습니다. 지금 업데이트할까요?"
        AlertDialog.Builder(activity)
            .setTitle(title)
            .setMessage(msg)
            .setPositiveButton("업데이트") { _, _ ->
                try {
                    activity.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(apkUrl)))
                } catch (_: Exception) {
                }
            }
            .setNegativeButton("나중에", null)
            .show()
    }
}

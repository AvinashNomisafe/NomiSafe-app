package com.nomisafe

import android.app.Activity
import android.content.Intent
import android.database.Cursor
import android.net.Uri
import android.app.Activity.RESULT_OK
import android.provider.OpenableColumns
import com.facebook.react.bridge.*

class FilePickerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), ActivityEventListener {

  private var pickerPromise: Promise? = null
  private val REQUEST_CODE = 9001

  init {
    reactContext.addActivityEventListener(this)
  }

  override fun getName(): String = "FilePickerModule"

  @ReactMethod
  fun showFilePicker(options: ReadableMap?, promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "Current activity is null")
      return
    }
    if (pickerPromise != null) {
      promise.reject("ALREADY_OPEN", "File picker is already open")
      return
    }
    pickerPromise = promise
    try {
      val intent = Intent(Intent.ACTION_OPEN_DOCUMENT)
      intent.addCategory(Intent.CATEGORY_OPENABLE)
      intent.type = "application/pdf"
      intent.putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("application/pdf"))
      val chooser = Intent.createChooser(intent, "Select PDF")
      activity.startActivityForResult(chooser, REQUEST_CODE)
    } catch (e: Exception) {
      pickerPromise = null
      promise.reject("ERROR", e.message)
    }
  }

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode != REQUEST_CODE) return
    val promise = pickerPromise ?: return
    pickerPromise = null
    if (resultCode != RESULT_OK) {
      val map = Arguments.createMap()
      map.putBoolean("didCancel", true)
      promise.resolve(map)
      return
    }
    val uri: Uri? = data?.data
    if (uri == null) {
      promise.reject("NO_DATA", "No file selected")
      return
    }
    try {
      val resolver = reactApplicationContext.contentResolver
      val mimeType = resolver.getType(uri) ?: "application/pdf"
      var name: String? = null
      var size: Long = -1
      resolver.query(uri, null, null, null, null)?.use { cursor ->
        val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
        val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
        if (cursor.moveToFirst()) {
          if (nameIndex != -1) name = cursor.getString(nameIndex)
          if (sizeIndex != -1) size = cursor.getLong(sizeIndex)
        }
      }
      val map = Arguments.createMap()
      map.putString("uri", uri.toString())
      if (name != null) map.putString("fileName", name)
      map.putString("type", mimeType)
      map.putDouble("size", size.toDouble())
      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("ERROR", e.message)
    }
  }

  override fun onNewIntent(intent: Intent) {}
}

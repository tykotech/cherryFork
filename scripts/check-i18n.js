'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
var fs = require('fs')
var path = require('path')
var translationsDir = path.join(__dirname, '../src/renderer/src/i18n/locales')
var baseLocale = 'en-us'
var baseFileName = ''.concat(baseLocale, '.json')
var baseFilePath = path.join(translationsDir, baseFileName)
/**
 * Recursively synchronize the target object to match the template object
 * 1. If a key exists in the template but is missing in the target, add it ('[to be translated]')
 * 2. If a key exists in the target but not in the template, remove it
 * 3. For child objects, recursively synchronize
 *
 * @param target Target object (the language object to update)
 * @param template Template object (English)
 * @returns Whether the target was updated
 */
function syncRecursively(target, template) {
  var isUpdated = false
  // Adding keys that exist in the template but are missing in the target
  for (var key in template) {
    if (!(key in target)) {
      target[key] =
        typeof template[key] === 'object' && template[key] !== null ? {} : '[to be translated]:'.concat(template[key])
      console.log('Add new property: '.concat(key))
      isUpdated = true
    }
    if (typeof template[key] === 'object' && template[key] !== null) {
      if (typeof target[key] !== 'object' || target[key] === null) {
        target[key] = {}
        isUpdated = true
      }
      // Recursively synchronize child objects
      var childUpdated = syncRecursively(target[key], template[key])
      if (childUpdated) {
        isUpdated = true
      }
    }
  }
  // Removing keys that exist in the target but not in the template
  for (var targetKey in target) {
    if (!(targetKey in template)) {
      console.log('Remove redundant property: '.concat(targetKey))
      delete target[targetKey]
      isUpdated = true
    }
  }
  return isUpdated
}
function syncTranslations() {
  if (!fs.existsSync(baseFilePath)) {
    console.error('Template file '.concat(baseFileName, ' does not exist, please check the path or file name.'))
    return
  }
  var baseContent = fs.readFileSync(baseFilePath, 'utf-8')
  var baseJson = {}
  try {
    baseJson = JSON.parse(baseContent)
  } catch (error) {
    console.error('Parse '.concat(baseFileName, ' failed:'), error)
    return
  }
  var files = fs.readdirSync(translationsDir).filter(function (file) {
    return file.endsWith('.json') && file !== baseFileName
  })
  for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
    var file = files_1[_i]
    var filePath = path.join(translationsDir, file)
    var targetJson = {}
    try {
      var fileContent = fs.readFileSync(filePath, 'utf-8')
      targetJson = JSON.parse(fileContent)
    } catch (error) {
      console.error('Parse '.concat(file, ' failed, skipping this file. Error info:'), error)
      continue
    }
    var isUpdated = syncRecursively(targetJson, baseJson)
    if (isUpdated) {
      try {
        fs.writeFileSync(filePath, JSON.stringify(targetJson, null, 2), 'utf-8')
        console.log('File '.concat(file, ' has been updated to synchronize with the template.'))
      } catch (error) {
        console.error('Write to '.concat(file, ' failed:'), error)
      }
    } else {
      console.log('File '.concat(file, ' does not need to be updated.'))
    }
  }
}
syncTranslations()

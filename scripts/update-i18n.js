/**
 * Paratera_API_KEY=sk-abcxxxxxxxxxxxxxxxxxxxxxxx123 node scripts/update-i18n.js
 */

// OCOOL API KEY
const Paratera_API_KEY = process.env.Paratera_API_KEY

// Check if API key is provided
if (!Paratera_API_KEY) {
  console.error('Error: The Paratera_API_KEY environment variable is missing or empty.')
  console.error('Please provide it by running:')
  console.error('Paratera_API_KEY=your_api_key_here yarn update:i18n')
  process.exit(1)
}

const INDEX = [
  //         Language Name          Code            Model for Translation
  { name: 'France', code: 'fr-fr', model: 'Qwen3-235B-A22B' },
  { name: 'Spanish', code: 'es-es', model: 'Qwen3-235B-A22B' },
  { name: 'Portuguese', code: 'pt-pt', model: 'Qwen3-235B-A22B' },
  { name: 'Greek', code: 'el-gr', model: 'Qwen3-235B-A22B' }
]

const fs = require('fs')
const { OpenAI } = require('openai')

const en = JSON.parse(fs.readFileSync('src/renderer/src/i18n/locales/en-us.json', 'utf8'))

const openai = new OpenAI({
  apiKey: Paratera_API_KEY,
  baseURL: 'https://llmapi.paratera.com/v1'
})

// Recursively traverse and translate
async function translate(en, obj, target, model, updateFile) {
  const texts = {}
  for (const e in en) {
    if (typeof en[e] == 'object') {
      // Traverse next level
      if (!obj[e] || typeof obj[e] != 'object') obj[e] = {}
      await translate(en[e], obj[e], target, model, updateFile)
    } else {
      // Add to current level translation list
      if (!obj[e] || typeof obj[e] != 'string') {
        texts[e] = en[e]
      }
    }
  }
  if (Object.keys(texts).length > 0) {
    const completion = await openai.chat.completions.create({
      model: model,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: `
You are a robot specifically designed for translation tasks. As a model that has been extensively fine-tuned on Russian language corpora, you are proficient in using the Russian language.
Now, please output the translation based on the input content. The input will include both Chinese and English key values, and you should output the corresponding key values in the Russian language.
When translating, ensure that no key value is omitted, and maintain the accuracy and fluency of the translation. Pay attention to the capitalization rules in the output to match the source text, and especially pay attention to whether to capitalize the first letter of each word except for prepositions. For strings containing \`{{value}}\`, ensure that the format is not disrupted.
Output in JSON.
#####################################################
INPUT
#####################################################
${JSON.stringify({
  confirm: 'Are you sure you want to back up the data?',
  select_model: 'Select Model',
  title: 'File',
  deeply_thought: 'Deeply thought (took {{secounds}} seconds)'
})}
#####################################################
MAKE SURE TO OUTPUT IN Russian. DO NOT OUTPUT IN UNSPECIFIED LANGUAGE.
#####################################################
                `
        },
        {
          role: 'assistant',
          content: JSON.stringify({
            confirm: 'Подтвердите резервное копирование данных?',
            select_model: 'Выберите Модель',
            title: 'Файл',
            deeply_thought: 'Глубоко продумано (заняло {{seconds}} секунд)'
          })
        },
        {
          role: 'user',
          content: `
You are a robot specifically designed for translation tasks. As a model that has been extensively fine-tuned on ${target} language corpora, you are proficient in using the ${target} language.
Now, please output the translation based on the input content. The input will include both Chinese and English key values, and you should output the corresponding key values in the ${target} language.
When translating, ensure that no key value is omitted, and maintain the accuracy and fluency of the translation. Pay attention to the capitalization rules in the output to match the source text, and especially pay attention to whether to capitalize the first letter of each word except for prepositions. For strings containing \`{{value}}\`, ensure that the format is not disrupted.
Output in JSON.
#####################################################
INPUT
#####################################################
${JSON.stringify(texts)}
#####################################################
MAKE SURE TO OUTPUT IN ${target}. DO NOT OUTPUT IN UNSPECIFIED LANGUAGE.
#####################################################
                `
        }
      ]
    })
    // Add translated key values and print missing or incorrect translations
    try {
      const result = JSON.parse(completion.choices[0].message.content)
      for (const e in texts) {
        if (result[e] && typeof result[e] === 'string') {
          obj[e] = result[e]
        } else {
          console.log('[warning]', `missing value "${e}" in ${target} translation`)
        }
      }
    } catch (e) {
      console.log('[error]', e)
      for (const e in texts) {
        console.log('[warning]', `missing value "${e}" in ${target} translation`)
      }
    }
  }
  // Delete redundant key values
  for (const e in obj) {
    if (!en[e]) {
      delete obj[e]
    }
  }
  // Update file
  updateFile()
}

// Execute the translation process
;(async () => {
  for (const { name, code, model } of INDEX) {
    const obj = fs.existsSync(`src/renderer/src/i18n/translate/${code}.json`)
      ? JSON.parse(fs.readFileSync(`src/renderer/src/i18n/translate/${code}.json`, 'utf8'))
      : {}
    await translate(en, obj, name, model, () => {
      fs.writeFileSync(`src/renderer/src/i18n/translate/${code}.json`, JSON.stringify(obj, null, 2), 'utf8')
    })
  }
})()

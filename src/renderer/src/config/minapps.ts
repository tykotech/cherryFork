import ThreeMinTopAppLogo from '@renderer/assets/images/apps/3mintop.png?url'
import AbacusLogo from '@renderer/assets/images/apps/abacus.webp?url'
import AIStudioLogo from '@renderer/assets/images/apps/aistudio.svg?url'
import ApplicationLogo from '@renderer/assets/images/apps/application.png?url'
import BaiduAiAppLogo from '@renderer/assets/images/apps/baidu-ai.png?url'
import BaiduAiSearchLogo from '@renderer/assets/images/apps/baidu-ai-search.webp?url'
import BaicuanAppLogo from '@renderer/assets/images/apps/baixiaoying.webp?url'
import BoltAppLogo from '@renderer/assets/images/apps/bolt.svg?url'
import CiciAppLogo from '@renderer/assets/images/apps/cici.webp?url'
import CozeAppLogo from '@renderer/assets/images/apps/coze.webp?url'
import DangbeiLogo from '@renderer/assets/images/apps/dangbei.jpg?url'
import DevvAppLogo from '@renderer/assets/images/apps/devv.png?url'
import DifyAppLogo from '@renderer/assets/images/apps/dify.svg?url'
import DoubaoAppLogo from '@renderer/assets/images/apps/doubao.png?url'
import DuckDuckGoAppLogo from '@renderer/assets/images/apps/duckduckgo.webp?url'
import FeloAppLogo from '@renderer/assets/images/apps/felo.png?url'
import FlowithAppLogo from '@renderer/assets/images/apps/flowith.svg?url'
import GeminiAppLogo from '@renderer/assets/images/apps/gemini.png?url'
import GensparkLogo from '@renderer/assets/images/apps/genspark.jpg?url'
import GithubCopilotLogo from '@renderer/assets/images/apps/github-copilot.webp?url'
import GrokAppLogo from '@renderer/assets/images/apps/grok.png?url'
import GrokXAppLogo from '@renderer/assets/images/apps/grok-x.png?url'
import HikaLogo from '@renderer/assets/images/apps/hika.webp?url'
import HuggingChatLogo from '@renderer/assets/images/apps/huggingchat.svg?url'
import KimiAppLogo from '@renderer/assets/images/apps/kimi.webp?url'
import LambdaChatLogo from '@renderer/assets/images/apps/lambdachat.webp?url'
import LeChatLogo from '@renderer/assets/images/apps/lechat.png?url'
import MetasoAppLogo from '@renderer/assets/images/apps/metaso.webp?url'
import MonicaLogo from '@renderer/assets/images/apps/monica.webp?url'
import n8nLogo from '@renderer/assets/images/apps/n8n.svg?url'
import NotebookLMAppLogo from '@renderer/assets/images/apps/notebooklm.svg?url'
import PerplexityAppLogo from '@renderer/assets/images/apps/perplexity.webp?url'
import PoeAppLogo from '@renderer/assets/images/apps/poe.webp?url'
import ZhipuProviderLogo from '@renderer/assets/images/apps/qingyan.png?url'
import QwenlmAppLogo from '@renderer/assets/images/apps/qwenlm.webp?url'
import SensetimeAppLogo from '@renderer/assets/images/apps/sensetime.png?url'
import SparkDeskAppLogo from '@renderer/assets/images/apps/sparkdesk.webp?url'
import ThinkAnyLogo from '@renderer/assets/images/apps/thinkany.webp?url'
import WanZhiAppLogo from '@renderer/assets/images/apps/wanzhi.jpg?url'
import YouLogo from '@renderer/assets/images/apps/you.jpg?url'
import TencentYuanbaoAppLogo from '@renderer/assets/images/apps/yuanbao.webp?url'
import YuewenAppLogo from '@renderer/assets/images/apps/yuewen.png?url'
import ZaiAppLogo from '@renderer/assets/images/apps/zai.png?url'
import ZhihuAppLogo from '@renderer/assets/images/apps/zhihu.png?url'
import ClaudeAppLogo from '@renderer/assets/images/models/claude.png?url'
import HailuoModelLogo from '@renderer/assets/images/models/hailuo.png?url'
import QwenModelLogo from '@renderer/assets/images/models/qwen.png?url'
import DeepSeekProviderLogo from '@renderer/assets/images/providers/deepseek.png?url'
import GroqProviderLogo from '@renderer/assets/images/providers/groq.png?url'
import OpenAiProviderLogo from '@renderer/assets/images/providers/openai.png?url'
import SiliconFlowProviderLogo from '@renderer/assets/images/providers/silicon.png?url'
import { MinAppType } from '@renderer/types'

// Load custom mini apps with enhanced error handling
const loadCustomMiniApp = async (): Promise<MinAppType[]> => {
  try {
    // Check if window.api is available
    if (!window.api || !window.api.file) {
      console.warn('File API not available, returning empty custom apps array')
      return []
    }

    let content: string
    try {
      content = await window.api.file.read('custom-minapps.json')
      console.log('Successfully loaded custom-minapps.json')
    } catch (error) {
      console.warn('custom-minapps.json not found, creating with empty array:', error)

      try {
        // If the file doesn't exist, create an empty JSON array
        content = '[]'
        await window.api.file.writeWithId('custom-minapps.json', content)
        console.log('Created new custom-minapps.json file')
      } catch (writeError) {
        console.error('Failed to create custom-minapps.json file:', writeError)
        // Return empty array if we can't even create the file
        return []
      }
    }

    // Parse the JSON content
    let customApps: any[]
    try {
      customApps = JSON.parse(content)
      if (!Array.isArray(customApps)) {
        console.warn('custom-minapps.json does not contain an array, using empty array')
        customApps = []
      }
    } catch (parseError) {
      console.error('Failed to parse custom-minapps.json, using empty array:', parseError)
      // Try to fix corrupted file by overwriting with empty array
      try {
        await window.api.file.writeWithId('custom-minapps.json', '[]')
        console.log('Fixed corrupted custom-minapps.json file')
      } catch (fixError) {
        console.error('Failed to fix corrupted file:', fixError)
      }
      return []
    }

    const now = new Date().toISOString()

    return customApps.map((app: any) => ({
      ...app,
      type: 'Custom',
      logo: app.logo && app.logo !== '' ? app.logo : ApplicationLogo,
      addTime: app.addTime || now
    }))
  } catch (error) {
    console.error('Unexpected error in loadCustomMiniApp:', error)
    return []
  }
}

// Initialize default mini apps
const ORIGIN_DEFAULT_MIN_APPS: MinAppType[] = [
  {
    id: 'openai',
    name: 'ChatGPT',
    url: 'https://chatgpt.com/',
    logo: OpenAiProviderLogo,
    bodered: true
  },
  {
    id: 'gemini',
    name: 'Gemini',
    url: 'https://gemini.google.com/',
    logo: GeminiAppLogo
  },
  {
    id: 'silicon',
    name: 'SiliconFlow',
    url: 'https://cloud.siliconflow.cn/playground/chat',
    logo: SiliconFlowProviderLogo
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    url: 'https://chat.deepseek.com/',
    logo: DeepSeekProviderLogo
  },
  {
    id: 'yi',
    name: 'WanZhi',
    url: 'https://www.wanzhi.com/',
    logo: WanZhiAppLogo,
    bodered: true
  },
  {
    id: 'zhipu',
    name: 'Zhipu AI',
    url: 'https://chatglm.cn/main/alltoolsdetail',
    logo: ZhipuProviderLogo
  },
  {
    id: 'moonshot',
    name: 'Kimi',
    url: 'https://kimi.moonshot.cn/',
    logo: KimiAppLogo
  },
  {
    id: 'baichuan',
    name: 'BaiXiaoYing',
    url: 'https://ying.baichuan-ai.com/chat',
    logo: BaicuanAppLogo
  },
  {
    id: 'dashscope',
    name: 'Tongyi Qianwen',
    url: 'https://tongyi.aliyun.com/qianwen/',
    logo: QwenModelLogo
  },
  {
    id: 'stepfun',
    name: 'Yuewen',
    url: 'https://yuewen.cn/chats/new',
    logo: YuewenAppLogo,
    bodered: true
  },
  {
    id: 'doubao',
    name: 'Doubao',
    url: 'https://www.doubao.com/chat/',
    logo: DoubaoAppLogo
  },
  {
    id: 'cici',
    name: 'Cici',
    url: 'https://www.cici.com/chat/',
    logo: CiciAppLogo
  },
  {
    id: 'minimax',
    name: 'Hailuo',
    url: 'https://hailuoai.com/',
    logo: HailuoModelLogo
  },
  {
    id: 'groq',
    name: 'Groq',
    url: 'https://chat.groq.com/',
    logo: GroqProviderLogo
  },
  {
    id: 'anthropic',
    name: 'Claude',
    url: 'https://claude.ai/',
    logo: ClaudeAppLogo
  },
  {
    id: 'baidu-ai-chat',
    name: 'ERNIE Bot',
    logo: BaiduAiAppLogo,
    url: 'https://yiyan.baidu.com/'
  },
  {
    id: 'baidu-ai-search',
    name: 'Baidu AI Search',
    logo: BaiduAiSearchLogo,
    url: 'https://chat.baidu.com/',
    bodered: true,
    style: {
      padding: 5
    }
  },
  {
    id: 'tencent-yuanbao',
    name: 'Tencent Yuanbao',
    logo: TencentYuanbaoAppLogo,
    url: 'https://yuanbao.tencent.com/chat',
    bodered: true
  },
  {
    id: 'sensetime-chat',
    name: 'SenseTime Chat',
    logo: SensetimeAppLogo,
    url: 'https://chat.sensetime.com/wb/chat',
    bodered: true
  },
  {
    id: 'spark-desk',
    name: 'SparkDesk',
    logo: SparkDeskAppLogo,
    url: 'https://xinghuo.xfyun.cn/desk'
  },
  {
    id: 'metaso',
    name: 'Meta AI Search',
    logo: MetasoAppLogo,
    url: 'https://metaso.cn/'
  },
  {
    id: 'poe',
    name: 'Poe',
    logo: PoeAppLogo,
    url: 'https://poe.com'
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    logo: PerplexityAppLogo,
    url: 'https://www.perplexity.ai/'
  },
  {
    id: 'devv',
    name: 'DEVV_',
    logo: DevvAppLogo,
    url: 'https://devv.ai/'
  },
  {
    id: 'hugging-chat',
    name: 'HuggingChat',
    logo: HuggingChatLogo,
    url: 'https://huggingface.co/chat/',
    bodered: true
  },
  {
    id: 'Felo',
    name: 'Felo',
    logo: FeloAppLogo,
    url: 'https://felo.ai/',
    bodered: true
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    logo: DuckDuckGoAppLogo,
    url: 'https://duck.ai'
  },
  {
    id: 'bolt',
    name: 'Bolt',
    logo: BoltAppLogo,
    url: 'https://bolt.new/',
    bodered: true
  },
  {
    id: 'thinkany',
    name: 'ThinkAny',
    logo: ThinkAnyLogo,
    url: 'https://thinkany.ai/',
    bodered: true,
    style: {
      padding: 5
    }
  },
  {
    id: 'hika',
    name: 'Hika',
    logo: HikaLogo,
    url: 'https://hika.fyi/',
    bodered: true
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    logo: GithubCopilotLogo,
    url: 'https://github.com/copilot'
  },
  {
    id: 'genspark',
    name: 'Genspark',
    logo: GensparkLogo,
    url: 'https://www.genspark.ai/'
  },
  {
    id: 'grok',
    name: 'Grok',
    logo: GrokAppLogo,
    url: 'https://grok.com',
    bodered: true
  },
  {
    id: 'grok-x',
    name: 'Grok / X',
    logo: GrokXAppLogo,
    url: 'https://x.com/i/grok',
    bodered: true
  },
  {
    id: 'qwenlm',
    name: 'QwenLM',
    logo: QwenlmAppLogo,
    url: 'https://qwenlm.ai/'
  },
  {
    id: 'flowith',
    name: 'Flowith',
    logo: FlowithAppLogo,
    url: 'https://www.flowith.io/',
    bodered: true
  },
  {
    id: '3mintop',
    name: '3MinTop',
    logo: ThreeMinTopAppLogo,
    url: 'https://3min.top',
    bodered: false
  },
  {
    id: 'aistudio',
    name: 'AI Studio',
    logo: AIStudioLogo,
    url: 'https://aistudio.google.com/'
  },
  {
    id: 'notebooklm',
    name: 'NotebookLM',
    logo: NotebookLMAppLogo,
    url: 'https://notebooklm.google.com/'
  },
  {
    id: 'coze',
    name: 'Coze',
    logo: CozeAppLogo,
    url: 'https://www.coze.com/space',
    bodered: true
  },
  {
    id: 'dify',
    name: 'Dify',
    logo: DifyAppLogo,
    url: 'https://cloud.dify.ai/apps',
    bodered: true,
    style: {
      padding: 5
    }
  },
  {
    id: 'lechat',
    name: 'LeChat',
    logo: LeChatLogo,
    url: 'https://chat.mistral.ai/chat',
    bodered: true
  },
  {
    id: 'abacus',
    name: 'Abacus',
    logo: AbacusLogo,
    url: 'https://apps.abacus.ai/chatllm',
    bodered: true
  },
  {
    id: 'lambdachat',
    name: 'Lambda Chat',
    logo: LambdaChatLogo,
    url: 'https://lambda.chat/',
    bodered: true
  },
  {
    id: 'monica',
    name: 'Monica',
    logo: MonicaLogo,
    url: 'https://monica.im/home/',
    bodered: true
  },
  {
    id: 'you',
    name: 'You',
    logo: YouLogo,
    url: 'https://you.com/'
  },
  {
    id: 'zhihu',
    name: 'Zhihu Direct Answer',
    logo: ZhihuAppLogo,
    url: 'https://zhida.zhihu.com/',
    bodered: true
  },
  {
    id: 'dangbei',
    name: 'Dangbei AI',
    logo: DangbeiLogo,
    url: 'https://ai.dangbei.com/',
    bodered: true
  },
  {
    id: `zai`,
    name: `Z.ai`,
    logo: ZaiAppLogo,
    url: `https://chat.z.ai/`,
    bodered: true,
    style: {
      padding: 10
    }
  },
  {
    id: 'n8n',
    name: 'n8n',
    logo: n8nLogo,
    url: 'https://app.n8n.cloud/',
    bodered: true,
    style: {
      padding: 5
    }
  }
]

// Initialize default apps safely
let DEFAULT_MIN_APPS: MinAppType[] = [...ORIGIN_DEFAULT_MIN_APPS]

// Initialize custom apps asynchronously
const initializeCustomApps = async () => {
  try {
    const customApps = await loadCustomMiniApp()
    DEFAULT_MIN_APPS = [...ORIGIN_DEFAULT_MIN_APPS, ...customApps]
    console.log(`Initialized ${customApps.length} custom mini apps`)
  } catch (error) {
    console.error('Failed to initialize custom apps, using defaults only:', error)
    DEFAULT_MIN_APPS = [...ORIGIN_DEFAULT_MIN_APPS]
  }
}

// Initialize on module load, but don't block
initializeCustomApps().catch((error) => {
  console.error('Failed to initialize custom apps during module load:', error)
})

function updateDefaultMinApps(param: MinAppType[]) {
  DEFAULT_MIN_APPS = param
}

// Function to get current apps and reinitialize if needed
const getCurrentMinApps = async (): Promise<MinAppType[]> => {
  // If DEFAULT_MIN_APPS only contains default apps, try to reinitialize
  if (DEFAULT_MIN_APPS.length === ORIGIN_DEFAULT_MIN_APPS.length) {
    try {
      await initializeCustomApps()
    } catch (error) {
      console.error('Failed to reinitialize custom apps:', error)
    }
  }
  return DEFAULT_MIN_APPS
}

export {
  DEFAULT_MIN_APPS,
  getCurrentMinApps,
  initializeCustomApps,
  loadCustomMiniApp,
  ORIGIN_DEFAULT_MIN_APPS,
  updateDefaultMinApps
}

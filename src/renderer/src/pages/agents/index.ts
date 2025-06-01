import { useEffect, useState } from 'react'

import { useRuntime } from '@renderer/hooks/useRuntime'
import store from '@renderer/store'
import { Agent } from '@renderer/types'

let _agents: Agent[] = []

export const getAgentsFromSystemAgents = (systemAgents: any) => {
  const agents: Agent[] = []

  if (!systemAgents || !Array.isArray(systemAgents)) {
    console.error('Invalid systemAgents data:', systemAgents)
    return agents
  }

  for (let i = 0; i < systemAgents.length; i++) {
    const agentData = systemAgents[i]
    // Handle both array and string group types
    const groups = Array.isArray(agentData.group)
      ? agentData.group
      : typeof agentData.group === 'string'
        ? [agentData.group]
        : ['Uncategorized']

    for (const group of groups) {
      const agent = {
        ...agentData,
        group: group,
        topics: [],
        type: 'agent'
      } as Agent
      agents.push(agent)
    }
  }

  console.log(`Processed ${agents.length} agents from ${systemAgents.length} system agents`)
  return agents
}

export function useSystemAgents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const { resourcesPath } = useRuntime()
  const { agentssubscribeUrl } = store.getState().settings

  useEffect(() => {
    const loadAgents = async () => {
      console.log('Starting to load agents...')
      console.log('agentssubscribeUrl:', agentssubscribeUrl)
      console.log('resourcesPath:', resourcesPath)

      try {
        // Check if remote data source is configured
        if (agentssubscribeUrl && agentssubscribeUrl.startsWith('http')) {
          console.log('Attempting to load agents from remote URL:', agentssubscribeUrl)
          try {
            await new Promise((resolve) => setTimeout(resolve, 500))
            const response = await fetch(agentssubscribeUrl)
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`)
            }
            const agentsData = (await response.json()) as Agent[]
            console.log('Successfully loaded', agentsData.length, 'agents from remote URL')
            setAgents(agentsData)
            return
          } catch (error) {
            console.error('Failed to load remote agents:', error)
            // Fall back to local agents if remote loading fails
            console.log('Falling back to local agents after remote load failed')
          }
        } else {
          console.log('No remote URL configured, loading local agents')
        }

        // Load local agents if no remote config or if remote loading failed
        if (resourcesPath) {
          const agentsPath = `${resourcesPath}/data/agents.json`
          console.log('Loading agents from resources path:', agentsPath)
          try {
            const localAgentsData = await window.api.fs.read(agentsPath)
            console.log('Successfully read agents.json file')
            _agents = JSON.parse(localAgentsData) as Agent[]
            console.log('Parsed', _agents.length, 'agents from local file')
          } catch (error) {
            console.error('Error loading local agents file:', error)
            // Use empty array if local file loading fails
            _agents = []
          }
        } else {
          console.warn('resourcesPath is not set, cannot load local agents')
          _agents = []
        }

        console.log('Setting agents in state, count:', _agents.length)
        setAgents(_agents)
      } catch (error) {
        console.error('Failed to load agents:', error)
        // Use cached agents if an error occurs
        console.log('Using cached agents after error, count:', _agents.length)
        setAgents(_agents)
      } finally {
        console.log('Finished loading agents')
      }
    }

    loadAgents()
  }, [resourcesPath, agentssubscribeUrl])

  return agents
}

export function groupByCategories(data: Agent[]) {
  const groupedMap = new Map<string, Agent[]>()
  data.forEach((item) => {
    item.group?.forEach((category) => {
      if (!groupedMap.has(category)) {
        groupedMap.set(category, [])
      }
      groupedMap.get(category)?.push(item)
    })
  })
  const result: Record<string, Agent[]> = {}
  Array.from(groupedMap.entries()).forEach(([category, items]) => {
    result[category] = items
  })
  return result
}

Let me provide a detailed introduction to how KnowledgeService controls the
number of concurrently processed items and workload.

## Concurrency Control and Workload Management Mechanism

KnowledgeService implements a sophisticated task queue system to control the
number of concurrently processed items and workload. This system is mainly
implemented through the following key components:

### 1. Key Variables and Limits

```typescript
private workload = 0
private processingItemCount = 0
private knowledgeItemProcessingQueueMappingPromise: Map<LoaderTaskOfSet, () => void> = new Map()
private static MAXIMUM_WORKLOAD = 1024 * 1024 * 80  // 约80MB
private static MAXIMUM_PROCESSING_ITEM_COUNT = 30
```

- `workload`: Tracks the total workload currently being processed (in bytes)
- `processingItemCount`: Tracks the number of items currently being processed
- `MAXIMUM_WORKLOAD`: Sets the maximum workload to 80MB
- `MAXIMUM_PROCESSING_ITEM_COUNT`: Sets the maximum number of concurrently
  processed items to 30

### 2. Workload Evaluation

Each task has a mechanism to evaluate its workload, represented by the
`evaluateTaskWorkload` property:

```typescript
interface EvaluateTaskWorkload {
  workload: number;
}
```

Different types of tasks have different workload evaluation methods:

- File tasks: Use file size as workload `{ workload: file.size }`
- URL tasks: Use a fixed value `{ workload: 1024 * 1024 * 2 }` (about 2MB)
- Sitemap tasks: Use a fixed value `{ workload: 1024 * 1024 * 20 }` (about 20MB)
- Note tasks: Use the byte length of the text content
  `{ workload: contentBytes.length }`

### 3. Task State Management

Tasks track their lifecycle through a status enum:

```typescript
enum LoaderTaskItemState {
  PENDING, // Pending
  PROCESSING, // Processing
  DONE, // Done
}
```

### 4. Core Logic of Task Queue Processing

The core queue processing logic is in the `processingQueueHandle` method:

```typescript
private processingQueueHandle() {
  const getSubtasksUntilMaximumLoad = (): QueueTaskItem[] => {
    const queueTaskList: QueueTaskItem[] = []
    that: for (const [task, resolve] of this.knowledgeItemProcessingQueueMappingPromise) {
      for (const item of task.loaderTasks) {
        if (this.maximumLoad()) {
          break that
        }

        const { state, task: taskPromise, evaluateTaskWorkload } = item

        if (state !== LoaderTaskItemState.PENDING) {
          continue
        }

        const { workload } = evaluateTaskWorkload
        this.workload += workload
        this.processingItemCount += 1
        item.state = LoaderTaskItemState.PROCESSING
        queueTaskList.push({
          taskPromise: () =>
            taskPromise().then(() => {
              this.workload -= workload
              this.processingItemCount -= 1
              task.loaderTasks.delete(item)
              if (task.loaderTasks.size === 0) {
                this.knowledgeItemProcessingQueueMappingPromise.delete(task)
                resolve()
              }
              this.processingQueueHandle()
            }),
          resolve: () => {},
          evaluateTaskWorkload
        })
      }
    }
    return queueTaskList
  }

  const subTasks = getSubtasksUntilMaximumLoad()
  if (subTasks.length > 0) {
    const subTaskPromises = subTasks.map(({ taskPromise }) => taskPromise())
    Promise.all(subTaskPromises).then(() => {
      subTasks.forEach(({ resolve }) => resolve())
    })
  }
}
```

The workflow of this method is:

1. Iterate over all pending task sets
2. For each subtask in each task set:
   - Check if the maximum load has been reached (via `maximumLoad()` method)
   - If the task state is PENDING:
     - Increase the current workload and processing item count
     - Update the task state to PROCESSING
     - Add the task to the execution queue
3. Execute all collected subtasks
4. When a subtask is completed:
   - Decrease the workload and processing item count
   - Remove the completed task from the task set
   - If the task set is empty, resolve the corresponding Promise
   - Recursively call `processingQueueHandle()` to process more tasks

### 5. Load Check

```typescript
private maximumLoad() {
  return (
    this.processingItemCount >= KnowledgeService.MAXIMUM_PROCESSING_ITEM_COUNT ||
    this.workload >= KnowledgeService.MAXIMUM_WORKLOAD
  )
}
```

This method checks whether the maximum load has been reached through two
conditions:

- The number of processing items reaches the upper limit (30)
- The total workload reaches the upper limit (80MB)

### 6. Task Addition and Execution Process

When adding a new task, the process is as follows:

1. Create a task (different types of tasks are created based on the type)
2. Add the task to the queue via `appendProcessingQueue`
3. Call `processingQueueHandle` to start processing tasks in the queue

```typescript
private appendProcessingQueue(task: LoaderTask): Promise<LoaderReturn> {
  return new Promise((resolve) => {
    this.knowledgeItemProcessingQueueMappingPromise.set(loaderTaskIntoOfSet(task), () => {
      resolve(task.loaderDoneReturn!)
    })
  })
}
```

## Advantages of Concurrency Control

This concurrency control mechanism has several important advantages:

1. **Resource usage optimization**: By limiting the number of concurrently
   processed items and total workload, it avoids excessive use of system
   resources
2. **Automatic adjustment**: When a task is completed, new tasks are
   automatically fetched from the queue to maintain efficient resource
   utilization
3. **Flexibility**: Different types of tasks have different workload
   evaluations, more accurately reflecting actual resource needs
4. **Reliability**: Through state management and Promise resolution mechanisms,
   it ensures tasks are completed correctly and notifies the caller

## Practical Application Scenarios

This concurrency control is especially useful when processing large amounts of
data, for example:

- Importing large directories, which may contain hundreds of files
- Processing large sitemaps, which may contain a large number of URLs
- Handling requests from multiple users adding knowledge base items
  simultaneously

Through this mechanism, the system can smoothly handle a large number of
requests, avoid resource exhaustion, and maintain good responsiveness.

In summary, KnowledgeService implements a complex and efficient task queue
system that ensures the system remains stable and efficient when processing
large amounts of data by precisely controlling the number of concurrently
processed items and workload.

import express from 'express'
import type { ChatContext, ChatMessage } from './chatgpt'
import { chatConfig, chatReplyProcess } from './chatgpt'

const app = express()
const router = express.Router()

app.use(express.static('public'))
app.use(express.json())

app.all('*', (_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.header('Access-Control-Allow-Methods', '*')
  next()
})

router.post('/chat-process', async (req, res) => {
  res.setHeader('Content-type', 'application/octet-stream')

  try {
    const { prompt, options = {} } = req.body as { prompt: string; options?: ChatContext }
    let firstChunk = true
    let ifAPI = false
    let userAPI = ''
    const words: string[] = prompt.split('!@#:')
    userAPI = JSON.parse(words[1]).data.userInfo.description
    if (!words.includes('sk'))
      ifAPI = false
    if (!ifAPI) {
      // .concat('---只回答---符号前面的内容   句尾换两行加上以下内容： 欢迎使用GPT，您未填写APIKEY，最多输出300字，请点击这里购买：https://tdchat.com/   句尾这句话必须加上并且不算字数 最多回答我不超过300字')
      await chatReplyProcess(words[0], options, (chat: ChatMessage) => {
        res.write(firstChunk ? JSON.stringify(chat) : `\n${JSON.stringify(chat)}`)
        firstChunk = false
        // const reply = `${JSON.stringify(chat)}`
        // const truncatedReply = reply.length > 200 ? `${reply.slice(0, 200)}...` : reply
        // res.write(firstChunk ? JSON.stringify({ ...chat, message: truncatedReply }) : `\n${JSON.stringify({ ...chat, message: truncatedReply })}\n\nThis is an automated response.`)
        // firstChunk = false
      })
    }
    else {
      await chatReplyProcess(words[0], options, (chat: ChatMessage) => {
        res.write(firstChunk ? JSON.stringify(chat) : `\n${JSON.stringify(chat)}`)
        firstChunk = false
      })
    }
    globalThis.console.log(prompt, userAPI, ifAPI)
  }
  catch (error) {
    res.write(JSON.stringify(error))
  }
  finally {
    res.end()
  }
})

router.post('/config', async (req, res) => {
  try {
    const response = await chatConfig()
    res.send(response)
  }
  catch (error) {
    res.send(error)
  }
})

app.use('', router)
app.use('/api', router)

app.listen(3002, () => globalThis.console.log('Server is running on port 3002'))

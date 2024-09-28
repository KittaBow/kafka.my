const express = require('express')
const { Kafka } = require('kafkajs')
const { Order, Product, sequelize } = require('./schema') // sequelize เอามา sync DB

const app = express()
const port = 8000

// ประกาศตัวแปร kafka
const kafka = new Kafka({
  clientId: 'express-app',
  brokers: ['localhost:9092', 'localhost:9092'] // ควรปรับเป็น broker 2 ตัว > แก้ที่ docker-compose, map port ให้ตรงกันด้วย
})

const producer = kafka.producer()

app.use(express.json()) // หรือใช้ body parser.json ก็ได้

// API สร้าง product
app.post('/api/create-product', async (req, res) => {
  const productData = req.body
  try {
    const product = await Product.create(productData)
    res.json(product)
  } catch (error) {
    res.json({
      message: 'something wront',
      error
    })
  }
})

// API placeorder
app.post('/api/placeorder', async (req, res) => {
  try {
    const { productId, userId } = req.body

    // 
    const product = await Product.findOne({ where: {
      id: productId
    }})

    if (product.amount <= 0) {
      res.json({
        message: 'product out of stock'
      })
      return false
    }

    // reduce amount
    product.amount -= 1
    await product.save() // .save = schema ตัวนี้จะอัพเดตไปใส่ schema ตัวเดิม แล้วเอา field ที่ object เปลี่ยนแปลงไปใส่

    // create order with status pending
    const order = await Order.create({
      productId: product.id,
      userLineUid: userId,
      status: 'pending'
    })


    const orderData = {
      productName: product.name,
      userId,
      orderId: order.id
    }

    
    // // ส่งไปที่ kafka
    // // concept = ตอนที่ส่งข้อมูลไป kafka จะ serialize ข้อมูลคือ ส่งข้อมูลไปหา consumer เป็น plaintext เท่านั้น
    // ดังนั้นเราต้องแปลงขอมูล JSON เป็น plaintext เพื่อให้ kafka deserialize ได้

    await producer.connect()
    await producer.send({
      topic: 'message-topic',
      messages: [{
        value: JSON.stringify(orderData) // JSON > plaintext
      }],
    })
    await producer.disconnect()

    res.json({
      message: `buy product ${product.name} successful. waiting message for confirm.`
    })
  } catch (error) {
    res.json({
      message: 'something wrong',
      error
    })
  }
})

app.listen(port, async () => {
  await sequelize.sync()
  console.log(`Express app listening at http://localhost:${port}`)
})

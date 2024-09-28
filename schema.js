const { Sequelize, DataTypes } = require('sequelize')

// use sequenlize
const sequelize = new Sequelize('tutorial', 'root', 'root', {
  host: 'localhost',
  dialect: 'mysql'
})

const Order = sequelize.define('orders', {
  userLineUid: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    // pending (ตอนสร้าง order), success (ตอนยิง msg แล้วเรียบร้อย)
    type: DataTypes.STRING,
    allowNull: false
  }
})

const Product = sequelize.define('products', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
})

Product.hasMany(Order) // product ถูกสั่งจากหลาย order ได้
Order.belongsTo(Product) // ผูก relation ของ order กับ productID เอาไว้, order 1 ทีไปตัด stock product

module.exports = {
  Order,
  Product,
  sequelize
}
/**
 * Module dependencies.
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const app = module.exports = express();
const cors = require('cors');

function error(status, msg) {
    var err = new Error(msg);
    err.status = status;
    return err;
}

const returnErr = (result, message, errno, res) => {
  // errno数值含义:
  // 1: 未找到内容; 2: 缺少所需数据或参数;
  // 3: 对数据库进行禁止的修改; 4: 用户输入的数据非法.
  result.errno = errno
  result.message = message
  console.log('result:', result)
  res.json(result)
}
const getShopInfoFromFile = shopId => {
  //读取商店列表文件,返回shopId对应的商店信息.
  //若未找到对应商店信息,则返回false.
  //若未传入shopId,则返回整个shopList.
  try {
    const data = fs.readFileSync(__dirname + '/shop-data/shop-info.json', 'utf8')
    const shopList = JSON.parse(data)
    let shopInfo = {} 
    if (!shopId) return shopList
    shopInfo = shopList.find(item => item.id == shopId)
    if (!shopInfo) return false
    return shopInfo
  } catch (err) {
    console.error(err)
  }
  console.log('test')
  return shopInfo
}
const readAccountListFile = () => {
  //读取账号列表文件,返回已parse的accountList.
  const data = fs.readFileSync(__dirname + '/user-data/account-list.json', 'utf8')
  const accountList = JSON.parse(data)
  return accountList
}
const readOrderRepositoryFile = () => {
  //读取账单列表文件,返回已parse的orderList.
  const data = fs.readFileSync(__dirname + '/order-data/order-repository.json', 'utf8')
  const orderList = JSON.parse(data)
  return orderList
}
const writeOrdersToFile = orders => {
  try {
    fs.writeFileSync(__dirname + '/order-data/order-repository.json'
    , JSON.stringify(orders, "", "\t")
    , err => {
    if (err) {
      console.error(err)
      return
    }
    console.log('/order-data/order-repository.json Written Successfully')
    })
  } catch (err) {
  console.error(err)
  }
}
const readAddressListFile = () => {
  // 读取账号列表文件,返回已parse的addressList.
  const data = fs.readFileSync(__dirname + '/user-data/address-list.json', 'utf8')
  const addressList = JSON.parse(data)
  return addressList
}
const writeAddressesToFile = addressList => {
  try {
    fs.writeFileSync(__dirname + '/user-data/address-list.json'
    , JSON.stringify(addressList, "", "\t")
    , err => {
    if (err) {
      console.error(err)
      return
    }
    console.log('/user-data/address-list.json Written Successfully')
    })
  } catch (err) {
  console.error(err)
  }
}
const retrieveUserAccount = (accountList, { userName, userId }) => {
  // 检索账户,返回resultOfFind.
  // userName和userId两个参数,至少得传入其中一个.  
  if((userName ?? userId) == undefined) throw Error('Need necessary arguments.')
  const data = []
  console.log('accountList:', accountList)
  accountList.forEach(item => data.push(item))
  
  const resultOfFind = data.find(item => {
    let isMatch = (userName === undefined || userName === item.userName) &&
    (userId === undefined || +userId === +item.id)
    return isMatch
  })
  return resultOfFind
}
const calcTotalPriceAndPayment = (productList, products) => {
  // productList是仓库商品列表,products是需计算的商品.都是对象数组.
  // productList中的item有name,id,price等键,
  // products则有id,count.
  // 返回的processedProducts有id,name,count,price,totalPrice.
  const processedProducts = []
  let payment = 0
  products.forEach(outProduct => {
    const inProduct = productList.find(inProduct => {
      return +inProduct.id === +outProduct.id
    })
    if(!inProduct) {
      console.log('Can\'t find this product which has id:', outProduct.id)
    }
    const product = {
      id: outProduct.id,
      name: inProduct.name,
      price: inProduct.price,
      count: outProduct.count
    }
    product.totalPrice = (product.count * product.price).toFixed(2)
    payment += +product.totalPrice
    processedProducts.push(product)
  })
  payment = payment.toFixed(2)
  console.log('payment:', payment)
  return { processedProducts, payment }
}
const calcTotalAmount =  products => {
  console.log('products:', products)
  const totalAmount = products.reduce((acc, item) => {
    return acc + item.count
  }, 0)

  return totalAmount
}
const queryShopIdByOrderId = (userId, orderId) => {
  const orders = readOrderRepositoryFile()
  const shopId = orders[userId][orderId].shopId
  // 注: 或许可以和下面的queryShopNameByOrderId函数合并.
  return shopId
}
const queryShopNameByOrderId = (userId, orderId) => {
  // 注: 可以扩展为queryShopNameByOrderIdOrShopId.
  const orders = readOrderRepositoryFile()
  const shopId = orders[userId][orderId].shopId

  const { cnName: shopCnName, enName: shopEnName } = getShopInfoFromFile(shopId)
  return { shopCnName, shopEnName }
}
 app.use(express.json())
 app.use(cors())

 app.get('/api/:name', (req, res, next) => {
  const options = {
    root: __dirname,
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true,
      'Access-Control-Allow-Origin': '*'
    }
  }
  var fileName = req.params.name + '.json'
  res.sendFile(fileName, options, function (err) {
    if (err) {
      console.log(err)
      next(err)
    } else {
      console.log('Sent:', fileName)
    }
  })
 })

 app.get('/api/shop/:shopId/:productId(\\d+)?', (req, res, next) => {
   // 注: 接下来写获取单个商品信息.
  var fileName = "./shop-data/shop-info.json"
  fs.readFile(fileName, 'utf8',
   (err, data) => {
    if (err) {
      console.error(err)
      next(err)
    }
    const shopId = req.params.shopId
    
    const shopInfo = JSON.parse(data).find(item => item.id == shopId)
    console.log('shopInfo:', shopInfo)
    
    if (!shopInfo) {
      res.status(404);
      res.send({ error: "Can't find that shop.", errno: 1 });
    }

    if (req.params.productId !== undefined) {
      const productId = +req.params.productId
      const productInfo = shopInfo.products.find(item => item.id === productId)
      if (productInfo === undefined) {
        res.status(404)
        res.send({ error: "Can't find that product.", errno: 1 })
        return
      }
      res.json(productInfo, "", "\t")
      return
    }

    if (req.query?.tab) {
      console.log('Shop' + shopId + shopInfo?.cnName + 'Has Sent')
    }

    res.json(shopInfo, "", "\t")

  })
 })

 app.post('/api/user/login-register', (req, res) => {
 //登录-注册 接收一个post的body中的json数据,
 //数据内容为一个对象,有userName和password属性.
  const accountTarget = req.body
  const { userName, password } = accountTarget

  //这里可以添加表单校验流程...

  let id = undefined

  //result是最后的数据结果,需要stringify后传给response
  const result = {}
  const createNewAccount = accountList => {
    //为文件写入新的账号列表
    const data = []
    accountList.forEach(item => data.push(item))
    const newAccount = { userName, password, id }
    console.log('newAccount:', newAccount, data)
    data.push(newAccount)
    const newAccountList = data
    console.log('createNewAccount', 'newAccountList:', newAccountList)
    try {
      fs.writeFileSync(__dirname + '/user-data/account-list.json'
      , JSON.stringify(newAccountList, "", "\t")
      , err => {
      if (err) {
        console.error(err)
        return
      }
      console.log('/user-data/account-list.json Written Successfully')
      })
    } catch (err) {
    console.error(err)
    }
  }
  const accountList = readAccountListFile()
  const resultOfFind = retrieveUserAccount(accountList, { userName })

  //整体流程:
  if (resultOfFind) {
    if (resultOfFind.password === password) {
      //登录成功:
      console.log('登录成功')
      id = resultOfFind?.id
      result.errno = 0 
      result.message = "Login Successfully"
      result.id = id
    } else {
      //密码错误:
      console.log('密码错误')
      result.errno = 1
      result.message = "Password Unmatched"
    }
  } else {
    //未找到账号,进入注册流程:
    console.log('未找到账号,进行注册')
    id = accountList.length;
    createNewAccount(accountList)
    result.errno = 0
    result.message = "Register Successfully"
    result.id = id
  }
  console.log('The response of login-register is:', result);
  res.json(result)
 })

 app.post('/api/user/order', (req, res) => {
   // 下订单的逻辑.
   const data = req.body
   const {
     accountId: userId,
     processCode,
     shopId,
     orderId,
     addressInfo,
     isCanceled,
     paytypeId,
     products
   } = data
   console.log(
     'userId:', userId, 'processCode:', processCode, 'shopId:', shopId, 'addressInfo:', addressInfo,
     'isCanceled:',isCanceled, 'paytypeId:', paytypeId, 'products:', products, 'orderId:', orderId,
   )

   if (!retrieveUserAccount(readAccountListFile(), { userId })) {
    returnNo1Err(result, 'Can\'t find that account.')
    return
   }

   const shopInfo = getShopInfoFromFile(shopId)
   const orders = readOrderRepositoryFile()
   const { products: productList, cnName: shopCnName } = shopInfo
   const result = {}
   orders[userId] = orders[userId] || {}
   const ordersByUserId = orders[userId]
   const order = ordersByUserId?.[orderId]
   const returnNo1Err = (result, message) => {
    result.message = message
    result.errno = 1
    console.log('result', result)
    res.json(result)
   }


   // 数据检验流程:
   switch (+processCode) {
     case 1:
     case 2:
       // 对购物车和订单确认阶段接收到的商店、用户、商品信息(及地址)进行检验. 
       const findNonexistentProducts = () => {
         const orderProductIdList = []
         const nonexistentProductIds = []
         products.forEach(product => orderProductIdList.push(product.id))
         orderProductIdList.forEach(id => {      
           if (!productList.find(product => product.id == id)) {
             nonexistentProductIds.push(id)
           }
         })
         return nonexistentProductIds
       }
       if (!shopInfo) {
         returnNo1Err(result, 'Can\'t find that shop.')
         return
       }
       if (findNonexistentProducts()?.length !== 0) {
         returnNo1Err(result, 'Can\'t find some products.')
         return
       }
       break;
     case 3:
       // 对支付阶段接收到的支付方式进行检验,
       // 注意isCanceled键值只能设置一次. 
       if (!(+paytypeId === 1) && !(+paytypeId === 2)) {
         returnNo1Err(result, 'Can\'t find that paytypeId.')
         return
       }
       if (order?.isCanceled !== undefined) {
         result.message = 'This order has already been settled.'
         result.errno = 3
         console.log('result', result)
         res.json(result)
         return
       }
       break;
     default:
       returnNo1Err(result, 'Can\'t find that processCode.')
       return
   }

   // 核心流程:
   switch(+processCode) {
     case 1: {
      // 购物车提交环节,返回商品相关信息和支付额.
      const { processedProducts, payment } = calcTotalPriceAndPayment(productList, products)
      result.errno = 0
      result.data = {
        shopCnName,
        payment,
        products: processedProducts
      }
      console.log('result', result)
      res.json(result)
      return
     }
     case 2: {
      // 订单确认环节,返回订单号、商店名、单总价和支付额.
      // 保留订单号等一系列信息.
      const { processedProducts, payment } = calcTotalPriceAndPayment(productList, products)
      if (!orders[userId]) orders[userId] = {}
      const orderIds = Object.keys(ordersByUserId)
      const newOrderId = (+orderIds[orderIds.length - 1] || 0) + 1
      const date = Date.now()
      const totalAmount = calcTotalAmount(processedProducts)
      ordersByUserId[newOrderId] = {
        shopId,
        totalAmount,
        payment,
        date,
        addressInfo,
        products: processedProducts
      }
      const newOrder = ordersByUserId[newOrderId]
      console.log('newOrder:', newOrder, 'newOrderId:', newOrderId, 'ordersByUserId:', ordersByUserId)
      writeOrdersToFile(orders)
      result.errno = 0
      result.data = {
        shopCnName,
        newOrderId,
        payment,
      }
      console.log('result', result)
      res.json(result)
      return
     }
     case 3:
      // 订单支付环节,检验订单号是否存在,返回orderId(或取消订单的错误码).
      // 若支付成功,则还应返回productIds,以删除购物车内相应商品.
      // 保留isCanceled、paytypeId值(若前者为true则不设置后者).
      // 先检验订单是否存在.
      if (!order) {
        returnNo1Err(result, 'Can\'t find that order.')
        return
      }
      console.log('userId:', userId, 'orderId:', orderId,
        'isCanceled:', isCanceled, 'paytypeId:', paytypeId)
      const productIds = []
      if (isCanceled === true) ordersByUserId[orderId] = { ...order, isCanceled }
      else if (isCanceled === false) {
        ordersByUserId[orderId] = { ...order, isCanceled, paytypeId }
        order.products.forEach(product => productIds.push(product.id))
      }
      const queriedShopId = queryShopIdByOrderId(userId, orderId)
      console.log('productIds:', productIds)
      writeOrdersToFile(orders)
      result.errno = 0
      result.data = { orderId, productIds, shopId: queriedShopId }
      console.log('result', result)
      res.json(result)
   }
 })

 app.post('/api/order-list', (req, res) => {
   // 若请求体不含订单号,则返回该用户所有订单的简略信息;
   // 若含,则返回该订单的详细信息.
   const { accountId: userId, orderId } = req.body
   const result = {}
   if (userId === undefined) {
    returnErr(result, 'Lack necessary req.body data.', 2, res)
    return
   }
   if (!retrieveUserAccount(readAccountListFile(), { userId })) {
     returnErr(result, 'Can\'t find that account.', 1, res)
     return
   }

   const orderList = readOrderRepositoryFile()
   orderList[userId] = orderList[userId] || {}
   const ordersByUserId = orderList[userId]
   if (!Object.keys(ordersByUserId).length) {
    result.errno = 0
    result.data = { msg: 'This user has no order yet.' }
    res.json(result)
    return
   }

   if (orderId === undefined) {
    const orders = {}
    for (let orderId in ordersByUserId) {
      const order = ordersByUserId[orderId]
      const {
        shopId,
        totalAmount,
        payment,
        isCanceled,
        products,
        date
      } = order
      const processedOrder = {
        shopId,
        id: NaN,
        totalAmount,
        payment,
        isCanceled,
        products,
        date
      }
      processedOrder.id = orderId
      const { enName: shopEnName, cnName: shopCnName } = getShopInfoFromFile(shopId)
      processedOrder.shopEnName = shopEnName
      processedOrder.shopCnName = shopCnName
      
      processedOrder.products.forEach((product, index, array) => array[index] = { id: product.id })
      orders[orderId] = processedOrder
      console.log('processedOrder:', processedOrder)
    }
    console.log('orders:', orders)
    result.errno = 0
    result.data = { orders }
    res.json(result)

   } else if (+orderId !== NaN && +orderId > 0) {
    // 返回单个订单的详情.
    const targetOrder = ordersByUserId[orderId]
    const { shopCnName, shopEnName } = queryShopNameByOrderId(userId, orderId)
    targetOrder.shopCnName = shopCnName
    targetOrder.shopEnName = shopEnName
    console.log('targetOrder:', targetOrder)
    
    result.errno = 0
    result.data = { targetOrder }
    res.json(result)
   }
 })

 app.post('/api/user/operate-order', (req, res) => {
  const { accountId: userId, orderId, operation } = req.body
  const result = {}
  if (
    +orderId !== NaN && +orderId > 0 ||
    +userId !== NaN && +userId >= 0 ||
    ['delete'].includes(operation) // 行首的数组应包含所有允许的订单操作,现仅有delete一项.
  ) { 
    if (!retrieveUserAccount(readAccountListFile(), { userId })) {
      returnErr(result, 'Can\'t find that account.', 1, res)
      return
    }
    const orderList = readOrderRepositoryFile()
    const ordersByUserId = orderList[userId]
    const targetOrder = ordersByUserId?.[orderId]
    if (!targetOrder) {
      returnErr(result, 'Can\'t find that order.', 1, res)
      return
    }

    delete ordersByUserId[orderId]
    console.log('deleted targetOrder.', 'orderList:', orderList)
    writeOrdersToFile(orderList)
    
    result.errno = 0
    result.data = { msg: 'Order deleted successfully.' }
    res.json(result)

  } else {
    returnErr(result, 'Lack necessary req.body data.', 2, res)
    return
   }
 })

 app.post('/api/address-list', (req, res) => {
   const result = {}
   const { accountId: userId, addressId } = req.body
   // 若请求不含addressId,则返回整个地址列表;
   // 若含,则返回对应的地址信息.
   // 若含且为-1,则返回库中第一条地址信息.

   if (userId === undefined) {
    returnErr(result, 'Lack necessary req.body data .', 2, res)
    return
   }

   if (!retrieveUserAccount(readAccountListFile(), { userId })) {
     returnErr(result, 'Can\'t find that account.', 1, res)
     return
   }

   const addressList = readAddressListFile()
   const addressesByUserId = addressList[userId]
   const returnEmptyMsg = () => {
    result.errno = 0
    result.data = { msg: 'This user have no address yet.' }
    res.json(result)
   }
   console.log('addressesByUserId:', addressesByUserId)

   if (!addressesByUserId) {
     // 用户无地址.
     addressList[userId] = []
     writeAddressesToFile(addressList)
     returnEmptyMsg()
     return
   }

   if (
     (typeof addressId === 'number' || typeof addressId === 'string') &&
     +addressId !== NaN
     ) {
       // 返回单个地址.
       if (+addressId > 0) {
          const addressDataById = addressesByUserId.find(item => +item.id === +addressId)
          if (!addressDataById) {
            returnErr(result, 'Can\'t find that addressDataById.', 1, res)
            return
          }
          console.log('addressDataById:', addressDataById)
          result.errno = 0
          result.data = { addressDataById }
          res.json(result)
          return
       } else if (+addressId === -1) {
        const firstAddressData = addressesByUserId?.[0]
        if (!firstAddressData) {
          returnEmptyMsg()
          return
        } 
        // 注:需对空地址列表做处理.

        console.log('firstAddressData:', firstAddressData)
        result.errno = 0
        result.data = { firstAddressData }
        res.json(result)
        return
       }
     }
   
   if (!addressesByUserId || addressesByUserId.length === 0) {
    // 该用户无地址时返回的信息.
    returnEmptyMsg()
    return
   }

  // 返回整个地址列表.
   result.errno = 0
   result.data = { addressesByUserId }
   res.json(result)
 })

 app.post('/api/operate-address/:type(edit|create)/:addressId(\\d+)?', (req, res) => {
  // addressId应该从1开始,但若为0也兼容.
  const result = {}
  const addressId = +req.params.addressId
  const operateType = req.params.type
  const { accountId: userId, operateData, isDelete } = req.body
  const { recipient, address, telNum } = operateData

  console.log('req.params:', req.params)

  if (!retrieveUserAccount(readAccountListFile(), { userId })) {
    returnErr(result, 'Can\'t find that account.', 1, res)
    return
  }
  
  if (
    [userId, operateType].includes(undefined) ||
    operateType === 'edit' &&
    addressId === undefined ||
    operateType === 'edit' &&
    String(isDelete) !== 'true' && [recipient, address, telNum, operateData].includes(undefined)
  ) {
    returnErr(result, 'Lack necessary req data .', 2, res)
    return
  }

  const regExps = {
    telNum: /^\d{11}$/,
    recipient: /^\p{L}{1,8}$/u,
    address: /^[\w\p{L}\p{P}\p{S} ]{1,30}$/u
  }
  
  if (!recipient.match(regExps.recipient)) {
    returnErr(result, 'recipient text is illegal.', 4, res)
    return
  }
  if (!telNum.match(regExps.telNum)) {
    returnErr(result, 'telNum text is illegal.', 4, res)
    return
  }
  if (!address.match(regExps.address)) {
    returnErr(result, 'address text is illegal.', 4, res)
    return
  }
  
  const addressList = readAddressListFile()
  const addressesByUserId = addressList[userId]
  
  switch (operateType) {
    case 'create':
      const newAddressId =
        addressesByUserId.length ?
        +addressesByUserId[addressesByUserId.length - 1].id + 1 :
        1
      const newAddress = { id: newAddressId, recipient, telNum, address }
      console.log('newAddress:', newAddress)

      addressesByUserId.push(newAddress)
      writeAddressesToFile(addressList)

      result.errno = 0
      break
    case 'edit':
      switch (isDelete) {
        case true:
        case 'true': {
          const targetAddressIndex = addressList[userId].findIndex(item => +item.id === addressId)
          addressList[userId].splice(targetAddressIndex, 1)
          console.log('targetAddressIndex:', targetAddressIndex)
          break
        }
        default: {
          const operatingAddress = addressList[userId].find(item => +item.id === addressId)
          console.log('operatingAddress1:', operatingAddress)
          operatingAddress.recipient = recipient
          operatingAddress.telNum = telNum
          operatingAddress.address = address
          console.log('operatingAddress2:', operatingAddress)
        }
      }

      writeAddressesToFile(addressList)
      result.errno = 0
  }
  res.json(result)
})

 app.use(function(err, req, res, next){
   // whatever you want here, feel free to populate
   // properties on `err` to treat it differently in here.
   // 无论这里你想要什么,随意创造err的属性吧,
   // 以此在这里区别对待它
   res.status(err.status || 500);
   res.send({ error: err.message });
 });

 app.use((req, res) => {
 // our custom JSON 404 middleware. Since it's placed last
 // it will be the last middleware called, if all others
 // invoke next() and do not respond.
 // (这是)我们自定义的json404中间件.因为它被放在最后,
 // 它会是最后一个调用的中间件,
 // 如果所有其他的都唤起next()并且不respond的话.
   res.status(404);
   res.send({error: "Can't find that" });
 });
 


 /* istanbul ignore next */
 if (!module.parent) {
 //  服务器每次启动时都会重置account-list.json, address-list.json和order-repository.json文件数据
 //  即,每次运行期间所有新建的账号数据都会在下次启动时清除
 //  只留下admin账号.
   const initializeJSONFile = (relativePath, data) => {
    if (path.extname(relativePath) !== '.json') throw Error('Need a relativePath with ".json" postfix.')
    fs.writeFileSync(__dirname + relativePath
    , JSON.stringify(data, "", "\t")
    , err => {
      if (err) {
        console.error(err)
        return
      }
    })
    const fileName = path.basename(relativePath)
    console.log(fileName + ' File Initialized Successfully.')
   }

   initializeJSONFile('/user-data/account-list.json',
    [{"id":0,"userName":"admin","password":"admin"}]
   )
   initializeJSONFile('/order-data/order-repository.json',
    {}
   )
   initializeJSONFile('/user-data/address-list.json',
    {
      '0': [
        {
          "id": 2,
          "recipient": "李明",
          "address": "北京市中南海",
          "telNum": "18545678901",
        }
      ]
    }
   )

   app.listen(3000);
   console.log('Express started');
 }
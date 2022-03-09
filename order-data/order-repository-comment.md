
下单时,通过post '/api/user/order'
购物车提交时,
  上传用户、商店、{商品、数量}和过程码1,
  后端返回商店名、{商品、商品名、数量、单价、总价}、支付额,
  后端不保留信息.
订单确认提交时,
  上传用户、商店、商品、商品名、数量、地址信息、过程码2,
  返回订单号、商店名、支付额,
  保留订单号、用户、商店、地址信息、商品、商品名、数量、单价、总价、支付额.(这时价格已经定下来了,不随仓库商品价格变化).
  创建Date并保留.
订单支付或取消时,
  上传过程码3、用户、订单号、支付方式,以及对应的isCanceled键值,
  返回订单号、支付成功与否的信息,若支付成功则还需返回各商品Id,
  保留对应的isCanceled键值.
  // 现在的订单系统尚未实现已取消、已完成、待支付状态功能,订单仅存在'已支付'状态.
以下均省略errno和message:
购物车提交时接收post数据结构:
    content-type: json
    body:
    {
    accountId: xxx,
    shopId: xxx,
    processCode: 1,
    products: [
    {
      id: xxx,
      count: xxx,
    },{
      ......
    }
    ]
    }
订单确认时接收post数据结构:
    content-type: json
    body:
    {
    accountId: xxx,
    shopId: xxx,
    addressInfo: {
      recipient: xxx,
      address: xxx,
      telNum: xxx
    },
    processCode: 2
    products: [
      {
        id: xxx,
        count: xxx,
      },{
        ......
      }
    ]
    }
支付时接收的post数据结构:
    content-type: json
    body:{
    userId: xxx,
    orderId: xxx,
    isCanceled: false,
    paytypeId: 1(wechat)/2(jdpay),
    processCode: 3
    }
订单确认时储存的数据结构:
  {
  xxx(accountId):
  {
    xxx(orderId):
    {
      addressInfo: {
        recipient: xxx,
        address: xxx,
        telNum: xxx
      },
      shopId: xxx,
      date: xxx,
      // isCanceled: false, (在支付或取消后设置)
      // paytype: 1(wechat)/2(jdpay), (在支付后设置)
      payment: xxx,
      products: [
        {
          id: xxx,
          name: xxx,
          count: xxx,
          price: xxx,
          totalPrice: xxx          
        },{
          ...
        }
        ...
      ]
    }
    ...
  }
  ...
  }
购物车提交时返回的数据结构:
  {
    data: {
      payment: xxx,
      products: [
        {
          name: xxx,
          price: xxx,
          count: xxx,
          totalPrice: xxx
        }
        ...
      ]
    }
  }
订单确认时返回的数据结构:
  {
  errno: 0,
  data: {
    shopCnName: xxx,
    newOrderId: xxx,
    payment: xxx,
  },
  message: 'xxxx' //errno !==0 时的错误信息
  }
支付时返回的数据结构:
  {
  errno: 0,
  data: {
    orderId: xxx, //订单id,错误码为零表示支付成功.
    productIds: [xx, ...] // 仅支付成功时返回.
    // 因故取消订单时,需返回对应错误码和错误信息.
  },
  message: 'xxxx' //errno !==0 时的错误信息
  }


查询订单列表时, 通过post '/api/orderlist'
若请求体不含订单号,则返回该用户所有订单的简略信息;
若含,则返回该订单的详细信息.
请求体内容: 用户、订单(非必须).
 数据结构: 
  content-type: json
  body: {
    accountId: xxx,
    // orderId: xxx,
  } 
响应体内容: 简略订单列表:
            订单、时间、取消、商店、中英商店名、商品、总数、总价;
           详细订单内容:
            订单、时间、取消、商店、商店名、商品、商品名、单价、
            数量、总价、总量、支付额、全地址.
 数据结构: (省略errno和message)
  data: {
    orders: {
      xxx(orderId): {
        date: xxx,
        isCanceled: xxx,
        shopId: xxx,
        shopCnName: xxx,
        totalAmount: xxx,
        payment: xxx,
        products: [
          {
            id: xxx,
          },
          ...
        ]
      },
      ...
    }
  }
  // 或者
  data: {
    orderId: xxx,
    date: xxx,
    isCanceled: xxx,
    shopId: xxx,
    shopCnName: xxx,
    products: {
      xxx: {
        name: xxx,
        price: xxx,
        count: xxx,
        totalPrice: xxx
      },
      ...
    },
    totalAmount: xxx
    payment: xxx,
    addressInfo: {
      recipient: xxx,
      address: xxx,
      telNum: xxx
    },
    addressName: xxx
  }


删除订单时, 通过post '/api/user/operate-order'
请求体内容: 用户、订单、删除操作.
 数据结构:
  body: {
    accountId: xxx,
    orderId: xxx,
    operation: 'delete'
  } 
响应体内容: 成功/失败信息.
 数据结构:
  errno: 0,
  data: {
    msg: 'Order deleted.'
  }
  // 或者报错.
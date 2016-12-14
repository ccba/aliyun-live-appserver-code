class Response {
  static fail(res, data) {
    console.log("请求结束－失败：" + JSON.stringify(data));
    res.status(200);
    res.json(data);
  }

  static success(res, data) {
    console.log("请求结束－成功：" + JSON.stringify(data));
    res.status(200);
    if (data && data.code) {
      data.message = '成功';
    } else {
      data = {
        code: 200,
        message: '成功',
        data: data
      };
    }
    res.json(data);
  }


  static onError(err, res) {
    console.error(Date());
    console.error(err);
    let data = err;
    if (!err.code)
      data = {
        code: 500,
        message: "系统异常"
      };

    if (res) {
      res.status(200);
      res.json(data);
    } else
      return data;
  }
}

module.exports = Response;

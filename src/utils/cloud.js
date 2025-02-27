class request {
  constructor(cloud) {
    const token = my.getStorageSync({ key: 'token' });
    const expiration = my.getStorageSync({ key: 'tokenExpiration' });
    this._token = token.data || '';
    this._tokenExpiration = expiration.data || '';
    this.cloud = cloud;
    this.fetchMap = new Map();
  }

  /**
   * 初始化
   */
  async init() {
    return await this.getToken();
  }

  /**
   * 网络请求
   */
  async fetch({ type = 'moet', kind, data }) {
    const now = new Date().getTime();
    let tokenTime = new Date(this._tokenExpiration).getTime();
    // tokenTime = 1585612800000;
    if (now > tokenTime) {
      // console.log('token 过期');
      await this.getToken();
    }
    const uploadData = Object.assign({}, data, { token: this._token });
    // console.log('uploadData', uploadData);
    let toAjax;
    try{
      toAjax = await this.cloud.function.invoke(
        type,
        uploadData,
        kind
      );
    } catch(e) {
      this.fetchMap.set(kind, {type, cur_params: data, status: 'done'});
      my.showToast({
        type: 'fail',
        duration: 1000,
        content: '网络错误，请稍后尝试！'
      });
      return {success: false};
    }
    const { result, success } = toAjax;
    this.fetchMap.set(kind, {type, cur_params: data, status: 'done'});
    // console.log('----------====success:', success);
    // console.log('----------====result:', result);
    // console.log(this);
    if (success) {
      return Object.assign({}, {data: result.data}, {success: true});
    } else {
      my.showToast({
        type: 'fail',
        duration: 1000,
        content: '网络错误！'
      });
      return Object.assign({}, result, {success: false});
    }
  }

  async getToken() {
    const { result, success } = await this.cloud.function.invoke(
      'moet',
      {},
      'getToken'
    );
    if (success) {
      this._token = `Bearer ${result.data.value}`;
      this._tokenExpiration = result.data.expiration;
      return this;
    } else {
      my.showToast({
        type: 'fail',
        duration: 1000,
        content: '网络错误！'
      });
      return this;
    }
  }
}

export default request;

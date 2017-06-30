class Identity {
  login(username, password) {
    $.ajax({
      context: this,
      method: 'post',
      url: 'request.php?action=login',
      data: { usr: username, pwd: password },
      dataType: 'json',
      success: function (data) {
        //this.setSessionKey(data.sessionKey);
        console.log(data);
      },

      error: function (data) {
        //not found
        console.log('something went wrong!');
      },
    });
  }

  register(username, password) {
    const _this = this;
    $.ajax({
      method: 'post',
      url: 'request.php?action=register',
      data: { usr: username, pwd: password },
      dataType: 'json',
      success: function (data) {
        //_this.setSessionKey(data.sessionKey);
      },

      error: function (data) {
        //not found
        console.log('something went wrong! :(');
      },
    });
  }

  setSessionKey(key) {
    console.log('hu?');
    window.sessionStorage.setItem('sessionKey', key);
  }
}

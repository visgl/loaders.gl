const STATUS = {
  REQUESTED: 'REQUESTED',
  COMPLETED: 'COMPLETED',
  ERROR: 'ERROR'
};

// A helper class to manage tile metadata fetching
export default class I3STileManager {
  constructor() {
    this._statusMap = {};
  }

  add(request, key, callback, options) {
    if (!this._statusMap[key]) {
      this._statusMap[key] = {request, callback, key, options, status: STATUS.REQUESTED};
      request()
        .then(data => {
          this._statusMap[key].status = STATUS.COMPLETED;
          this._statusMap[key].callback(data, options);
        })
        .catch(error => {
          this._statusMap[key].status = STATUS.ERROR;
          callback(error);
        });
    }
  }

  update(key, options) {
    if (this._statusMap[key]) {
      this._statusMap[key].options = options;
    }
  }

  find(key) {
    return this._statusMap[key];
  }
}

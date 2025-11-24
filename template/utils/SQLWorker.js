import con from "../config/database.js";

//////////////////////////////////////////////////////////////////////
//                           DB  Workers                            //
//////////////////////////////////////////////////////////////////////

export const SELECT_Q = (query, type, no_data_err = true) => {
    return new Promise((resolve, reject) => {
        con.query(query, (err, result) => {
            console.log('\x1B[31m**************************')
            console.log('err :', err);
            console.log('\x1B[31m**************************\x1b[0m')
            if (!err) {
                if (result?.rows.length > 0) {
                    if (type == 'S') {
                        resolve(result?.rows[0]);
                    } else {
                        resolve(result?.rows);
                    }
                } else {
                    if (type == 'S') {
                        resolve(null);
                    } else {
                        if (no_data_err) {
                            reject("no_data");
                        } else {
                            resolve([]);
                        }
                    }
                }
            } else {
                reject(err);
            }
        })
    });
};

export const UPDATE_Q = (query, data) => {
    return new Promise((resolve, reject) => {
        con.query(query, data, (err, result) => {
            if (!err) {
                resolve(result);
            } else {
                reject(err);
            }
        })
    });
};

export const INSERT_Q = (query, data) => {
    return new Promise((resolve, reject) => {
        con.query(query, data, (err, result) => {
            if (!err) {
                resolve(result.insertId);
            } else {
                reject(err);
            }
        })
    });
};

export const DELETE_Q = (query) => {
    return new Promise((resolve, reject) => {
        con.query(query, (err, result) => {
            if (!err) {
                resolve(result);
            } else {
                reject(err);
            }
        })
    });
};
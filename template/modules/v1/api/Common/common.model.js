import { SELECT_Q } from '../../../../utils/SQLWorker.js';
import headerValidator from '../../../../middleware/headerValidator.js';
const { sendResponse } = headerValidator;

//////////////////////////////////////////////////////////////////////
//                           Common API                             //
//////////////////////////////////////////////////////////////////////
let Common = {

    countryList: async (req, res) => {
        try {
            let countryListData = await SELECT_Q(`select MAX(id) AS country_id, MAX(name) AS name, phonecode, MAX(iso2) AS iso2 from tbl_country where status='Active' GROUP BY phonecode order by phonecode asc`, "M", false);
            if (countryListData?.[0]) {
                return sendResponse(req, res, 200, 'success', { keyword: "country_list_found", components: {} }, countryListData);
            } else {
                return sendResponse(req, res, 204, 'failed', { keyword: "no_data", components: {} }, countryListData);
            }
        } catch (e) {
            console.log('e :', e);
            return sendResponse(req, res, 400, 'failed', { keyword: "something_went_wrong", components: {} }, e?.message);
        }
    },

}
export default {
    Common
};
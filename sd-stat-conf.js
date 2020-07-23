import wepy from 'wepy';
import versionConfig from '@/common/version_config'
const systemInfo = wx.getSystemInfoSync();
const APP_ID_WX = 'wxfe2590021b4a70a7';
const app_id =  APP_ID_WX;

const pathNameMap = {
  'pages/index':'p_index',
  'packageGame/house':'p_house',
  'packageGame/rank_list':'p_rank_list',
  'pages/choose_game':'p_choose_game',
  'packageMall/add_address':'p_add_address',
  'packageMall/checkout_order':'p_checkout_order',
  'packageMall/goods_detail':'p_goods_detail',
  'packageMall/my_order':'p_my_order',
  'packageMall/address_list':'p_address_list',
  'packageMall/payment':'p_payment',
  'packageMall/order_detail':'p_order_detail',
  'packageMall/choose_product':'p_choose_product',
  'packageGame/quick_match': 'p_quick_match',
  'packageGame/quick_match_b': 'p_quick_match_b',
  'packageGame/pay_game': 'p_pay_game',
  'packageNotify/h5_ad': 'p_h5_ad',
  'packageMall/help_pay': 'p_help_pay',
};

exports.app_id = "wxfe2590021b4a70a7";
exports.app_name = "赛一赛赢奖品";
exports.defaultPath = 'pages/index';//小程序的默认首页, 用于分享时path为空时
exports.version_name = versionConfig.miniProgram.version_name;
exports.pathNameMap = pathNameMap;

<?php

namespace App\Http\Controllers\API\V1\Service;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PaymentController extends Controller

{
    private $vnp_TmnCode = 'AK72QHWH'; // Mã Website
    private $vnp_HashSecret = 'SDRMIJ3OV1WDCATPVIMOVDA4LB7S1IQF';
    public function createPayment($request)
    {
        try {
        //    bắt buộc gửi lên phải có order_id và total_amount
            // $request->validate([
            //     "order_id" => "required",
            //     "total_amount" => "required"
            // ]);
            $vnp_TmnCode = $this->vnp_TmnCode;
            $vnp_HashSecret = $this->vnp_HashSecret;
            $vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
            // trả về url mà bạn muốn hiển thị khi thanh toán thành công
            $vnp_Returnurl = "http://127.0.0.1:8000/api/v1/payment/vnpay-return";

            $vnp_TxnRef = $request->order_id;
            $vnp_Amount = $request->total_amount * 100;
            $vnp_OrderInfo = str_replace(" ", "%20", "Payment for order #" . $vnp_TxnRef);
            $vnp_Locale = 'vn';

            $inputData = [
                "vnp_Version" => "2.1.0",
                "vnp_TmnCode" => $vnp_TmnCode,
                "vnp_Amount" => $vnp_Amount,
                "vnp_Command" => "pay",
                "vnp_CreateDate" => date('YmdHis'),
                "vnp_CurrCode" => "VND",
                "vnp_IpAddr" => request()->ip(),
                "vnp_Locale" => $vnp_Locale,
                "vnp_OrderInfo" => $vnp_OrderInfo,
                "vnp_OrderType" => "billpayment",
                "vnp_ReturnUrl" => $vnp_Returnurl,
                "vnp_TxnRef" => $vnp_TxnRef,
            ];

            ksort($inputData);

            $hashdata = http_build_query($inputData, '', '&');
            $vnpSecureHash = hash_hmac('sha512', $hashdata, $vnp_HashSecret);

            $query = http_build_query($inputData);
            $vnp_Url = $vnp_Url . "?" . $query . '&vnp_SecureHash=' . $vnpSecureHash;

            return response()->json([
                'payment_url' => $vnp_Url
            ]);
        } catch (\Exception $ex) {
            return response()->json([
                "message" => $ex->getMessage(),

            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
    public function vnpayReturn(Request $request)
    {

        $vnp_TxnRef = $request->vnp_TxnRef;
        $vnp_Amount = $request->vnp_Amount;
        $vnp_ResponseCode = $request->vnp_ResponseCode;
        $vnp_SecureHash = $request->vnp_SecureHash;

        $vnp_HashSecret = $this->vnp_HashSecret; // Lấy từ biến lớp để nhất quán

        // Tạo mảng inputData từ request và sắp xếp
        $inputData = [];
        foreach ($request->all() as $key => $value) {
            if (substr($key, 0, 4) == "vnp_") {
                $inputData[$key] = $value;
            }
        }
        unset($inputData['vnp_SecureHash']); // Xóa mã hash trước khi tạo lại

        ksort($inputData);
        $hashData = http_build_query($inputData, '', '&'); // Xây dựng chuỗi mà không dùng `urldecode`

        // Tạo mã hash để so sánh
        $secureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);

        if ($secureHash === $vnp_SecureHash) {
            if ($vnp_ResponseCode == "00") {
                return[
                    'status' => 'success',
                    'message' => 'Thanh toán thành công!',
                    'order_id' => $vnp_TxnRef,
                    'amount' => $vnp_Amount / 100,
                ];
            } else {
                return [
                    'status' => 'error',
                    'message' => 'Thanh toán thất bại!',
                    'order_id' => $vnp_TxnRef,
                    'error_code' => $vnp_ResponseCode,
                ];
            }
        } else {
            return [
                'status' => 'error',
                'message' => 'Xác thực không hợp lệ!',
            ];
        }
    }
}

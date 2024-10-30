<?php

namespace App\Http\Controllers\Api\V1\Client;

use App\Models\Cart;
use App\Models\User;
use App\Models\Product;
use App\Models\Voucher;
use App\Models\CartItem;
use App\Models\VoucherMeta;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use App\Http\Helper\Product\GetUniqueAttribute;
use App\Http\Requests\Checkout\StoreCheckoutRequest;

class CheckoutController extends Controller
{
    public function store(StoreCheckoutRequest $request)
    {
        try {
            $data = $request->validated(); // Lấy dữ liệu đã xác thực

            // Kiểm tra xem người dùng có muốn mua ngay hay không
            $isImmediatePurchase = isset($data['product_id']) && isset($data['quantity']);

            // Kiểm tra xem người dùng có muốn mua từ giỏ hàng hay không
            $isCartPurchase = isset($data['cart_item_ids']) && is_array($data['cart_item_ids']) && count($data['cart_item_ids']) > 0;

            // Nếu cả hai trường hợp đều không đúng thì trả về lỗi
            if (!$isImmediatePurchase && !$isCartPurchase) {
                return response()->json(['message' => 'Phải chọn mua ngay hoặc mua từ giỏ hàng.'], Response::HTTP_BAD_REQUEST);
            } elseif ($isImmediatePurchase && $isCartPurchase) {
                return response()->json(['message' => 'Phải chọn mua ngay hoặc mua từ giỏ hàng.'], Response::HTTP_BAD_REQUEST);
            }

            // Khởi tạo biến cho tổng tiền và danh sách sản phẩm
            $sub_total = 0;
            $total_items = 0;
            $order_items = [];
            $voucher_discount = 0;

            // Kiểm tra thông tin người dùng nếu đã đăng nhập
            if (auth('sanctum')->check()) {
                $user_id = auth('sanctum')->id();
                $user = User::findOrFail($user_id)->only(['id', 'name', 'email', 'address', 'phone_number']);

                if ($isCartPurchase) {
                    // Handle cart purchase logic for logged-in users
                    $cart = Cart::query()
                        ->where('user_id', $user['id'])
                        ->with([
                            "cartitems" => function ($query) use ($data) {
                                $query->whereIn('id', $data['cart_item_ids']);
                            },
                            "cartitems.product",
                            "cartitems.productvariant.attributes"
                        ])
                        ->first();

                    if (!$cart || $cart->cartitems->isEmpty()) {
                        return response()->json(['message' => 'Sản phẩm không tồn tại trong giỏ hàng'], 400);
                    }

                    // Kiểm tra nếu có sản phẩm nào không tồn tại trong giỏ hàng
                    $invalid_items = array_diff($data['cart_item_ids'], $cart->cartitems->pluck('id')->toArray());

                    if (!empty($invalid_items)) {
                        return response()->json([
                            'message' => 'Sản phẩm không tồn tại trong giỏ hàng',
                            'invalid_items' => $invalid_items // Gửi danh sách sản phẩm không hợp lệ để người dùng biết
                        ], 400);
                    }

                    foreach ($cart->cartitems as $cart_item) {
                        $quantity = $cart_item->quantity;
                        $total_items += 1;

                        if ($cart_item->productvariant) {
                            $variant_price = $cart_item->productvariant->price_sale;
                            $total_price = $variant_price * $quantity;
                        } else {
                            $product_price = $cart_item->product->price_sale;
                            $total_price = $product_price * $quantity;
                        }

                        $sub_total += $total_price;
                        $order_items[] = [
                            'quantity' => $quantity,
                            'total_price' => $total_price,
                            'product' => $cart_item->product,
                            'variant' => $cart_item->productvariant ?? null
                        ];
                    }
                } elseif ($isImmediatePurchase) {
                    // Handle immediate purchase
                    $product = Product::with('variants.attributes')->findOrFail($data['product_id']);
                    // dd($product);
                    $quantity = $data['quantity'];
                    $total_items += 1;

                    if ($product->type == 1) {
                        // Sản phẩm có biến thể
                        if (!isset($data['product_variant_id'])) {
                            return response()->json(['message' => 'Sản phẩm này có biến thể. Vui lòng chọn biến thể.'], Response::HTTP_BAD_REQUEST);
                        }
                        $variant = $product->variants()->with('attributes')->findOrFail($data['product_variant_id']);
                        $total_price = $variant->price_sale * $quantity;
                    } else {
                        // Sản phẩm đơn
                        $total_price = $product->price_sale * $quantity;
                    }

                    $sub_total = $total_price;
                    $order_items[] = [
                        'quantity' => $quantity,
                        'total_price' => $total_price,
                        'product' => $product,
                        'variant' => $variant ?? null
                    ];
                }
            } else {
                // Người dùng chưa đăng nhập
                if ($isImmediatePurchase) {
                    $product = Product::query()->findOrFail($data['product_id']);
                    $quantity = $data['quantity'];
                    $total_items += 1;

                    if ($product->type == 1) {
                        // Sản phẩm có biến thể
                        if (!isset($data['product_variant_id'])) {
                            return response()->json(['message' => 'Sản phẩm này có biến thể. Vui lòng chọn biến thể.'], Response::HTTP_BAD_REQUEST);
                        }
                        $variant = $product->variants()
                            ->with('attributes') // Gọi thêm attributes
                            ->findOrFail($data['product_variant_id']);
                        $total_price = $variant->price_sale * $quantity;
                    } else {
                        // Sản phẩm đơn
                        $total_price = $product->price_sale * $quantity;
                    }

                    $sub_total = $total_price;
                    $order_items[] = [
                        'quantity' => $quantity,
                        'total_price' => $total_price,
                        'product' => $product,
                        'variant' => $variant ?? null
                    ];
                } else {
                    return response()->json(['message' => 'Bạn cần đăng nhập để mua từ giỏ hàng.'], Response::HTTP_BAD_REQUEST);
                }
            }
            // dd($order_items);
            // Kiểm tra và áp dụng voucher chỉ nếu người dùng đã đăng nhập
            if (isset($data['voucher_code'])) {
                if (auth('sanctum')->check()) {
                    $voucher_result = $this->applyVoucher($data['voucher_code'], $order_items);

                    if (!isset($voucher_result['error'])) {
                        // Cập nhật giảm giá tổng và sub_total
                        $total_discount = $voucher_result['total_discount'] ?? 0; // Tổng số tiền giảm từ voucher
                        $sub_total -= $total_discount;

                        // Cập nhật lại order_items với các sản phẩm đủ điều kiện và không đủ điều kiện
                        $order_items = array_merge($voucher_result['eligible_products'], $voucher_result['ineligible_products']);
                    } else {
                        return response()->json(['error' => $voucher_result['error']], 400);
                    }
                } else {
                    return response()->json(['message' => 'Bạn cần đăng nhập để sử dụng Voucher này.'], Response::HTTP_BAD_REQUEST);
                }
            }

            return response()->json([
                "message" => "Dữ liệu thành công",
                "user" => auth('sanctum')->check() ? $user : null,
                "sub_total" => $sub_total,
                "total_items" => $total_items,
                "voucher_discount" => $voucher_result['voucher_description'] ?? null, // Sử dụng mô tả chiết khấu voucher
                "total_discount" => $total_discount ?? 0, // Tổng số tiền giảm
                "order_items" => $order_items,
            ], Response::HTTP_OK);
        } catch (\Exception $ex) {
            return response()->json(["message" => $ex->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    // Hàm applyVoucher
    protected function applyVoucher($voucher_code, $order_items)
    {
        $voucher = Voucher::where('code', $voucher_code)
            ->where('is_active', true)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->first();

        if (!$voucher) {
            return ['error' => 'Voucher không hợp lệ hoặc đã hết hạn.'];
        }

        $voucher_metas = VoucherMeta::where('voucher_id', $voucher->id)->pluck('meta_value', 'meta_key')->toArray();
        $eligible_products = [];
        $ineligible_products = [];
        $sub_total = 0;

        foreach ($order_items as $item) {
            $product_id = $item['product']->id;
            $is_eligible = true;
            $reason = [];

            // Kiểm tra điều kiện danh mục và sản phẩm
            if (isset($voucher_metas['_voucher_category_ids'])) {
                $allowed_category_ids = json_decode($voucher_metas['_voucher_category_ids'], true);
                if (!in_array($item['product']->category_id, $allowed_category_ids)) {
                    $is_eligible = false;
                    $reason[] = 'Sản phẩm này không nằm trong danh mục được áp dụng voucher.';
                }
            }

            if (isset($voucher_metas['_voucher_exclude_category_ids'])) {
                $excluded_category_ids = json_decode($voucher_metas['_voucher_exclude_category_ids'], true);
                if (in_array($item['product']->category_id, $excluded_category_ids)) {
                    $is_eligible = false;
                    $reason[] = 'Sản phẩm này thuộc danh mục bị loại trừ khỏi voucher.';
                }
            }

            if (isset($voucher_metas['_voucher_product_ids'])) {
                $allowed_product_ids = json_decode($voucher_metas['_voucher_product_ids'], true);
                if (!in_array($product_id, $allowed_product_ids)) {
                    $is_eligible = false;
                    $reason[] = 'Sản phẩm này không nằm trong danh sách sản phẩm được áp dụng voucher.';
                }
            }

            if (isset($voucher_metas['_voucher_exclude_product_ids'])) {
                $excluded_product_ids = json_decode($voucher_metas['_voucher_exclude_product_ids'], true);
                if (in_array($product_id, $excluded_product_ids)) {
                    $is_eligible = false;
                    $reason[] = 'Sản phẩm này nằm trong danh sách sản phẩm bị loại trừ khỏi voucher.';
                }
            }

            // Thêm vào danh sách và cộng dồn giá trị
            if ($is_eligible) {
                $eligible_products[] = $item;
                $sub_total += $item['total_price'];
            } else {
                $item['reason'] = implode(' ', $reason);
                $ineligible_products[] = $item;
            }
        }

        // Kiểm tra giá trị tối thiểu của đơn hàng
        if (isset($voucher_metas['_voucher_min_order_value']) && $sub_total < $voucher_metas['_voucher_min_order_value']) {
            return [
                'error' => "Tổng giá trị đơn hàng phải lớn hơn " . $voucher_metas['_voucher_min_order_value'] . " để áp dụng voucher này.",
                'ineligible_products' => $ineligible_products,
            ];
        }
        $voucher_discount = 0;
        $voucher_description = ''; // Khởi tạo mô tả voucher

        // Nếu voucher áp dụng cho tổng đơn hàng
        if (isset($voucher_metas['_voucher_applies_to_total']) && $voucher_metas['_voucher_applies_to_total']) {
            if ($voucher->discount_type == 'percent') {
                $voucher_discount = ($voucher->discount_value / 100) * $sub_total;
                $voucher_description = "{$voucher->discount_value} percent"; // Mô tả cho voucher phần trăm
            } elseif ($voucher->discount_type == 'fixed') {
                $voucher_discount = min($voucher->discount_value, $sub_total);
                $voucher_description = "{$voucher->discount_value} fixed"; // Mô tả cho voucher cố định
            }

            return [
                'voucher_discount' => $voucher_discount,
                'voucher_description' => $voucher_description,
                'eligible_products' => $eligible_products,
                'ineligible_products' => $ineligible_products,
                'total_discount' => $voucher_discount, // Tổng số tiền giảm
                'sub_total_after_discount' => $sub_total - $voucher_discount,
            ];
        }

        // Nếu voucher áp dụng cho từng sản phẩm
        foreach ($eligible_products as &$item) {
            $item_discount = 0;
            if ($voucher->discount_type == 'percent') {
                $item_discount = ($voucher->discount_value / 100) * $item['total_price'];
                $voucher_description = "{$voucher->discount_value} percent"; // Mô tả cho voucher phần trăm
            } elseif ($voucher->discount_type == 'fixed') {
                $item_discount = min($voucher->discount_value, $item['total_price']);
                $voucher_description = "{$voucher->discount_value} fixed"; // Mô tả cho voucher cố định
            }
            $voucher_discount += $item_discount;
            $item['voucher_discount'] = $item_discount;
            $item['price_after_discount'] = $item['total_price'] - $item_discount;
        }

        return [
            'voucher_discount' => $voucher_discount,
            'voucher_description' => $voucher_description, // Trả về mô tả voucher
            'eligible_products' => $eligible_products,
            'ineligible_products' => $ineligible_products,
            'total_discount' => $voucher_discount, // Tổng số tiền giảm
        ];
    }

    public function getProvinces()
    {
        try {

            $api_key = '18f28540-8fbc-11ef-839a-16ebf09470c6';

            $ch = curl_init();

            curl_setopt($ch, CURLOPT_URL, "https://online-gateway.ghn.vn/shiip/public-api/master-data/province");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Token: ' . $api_key,
                'Content-Type: application/json'
            ]);

            $response = curl_exec($ch);
            curl_close($ch);

            $provinces = json_decode($response, true)['data'];

            return response()->json([
                "message" => "Lấy dữ liệu thành công",
                "provinces" => $provinces
            ], Response::HTTP_OK);
        } catch (\Exception $ex) {
            return response()->json([
                "message" => $ex->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
    public function getDistricts(Request $request)
    {
        try {

            $request->validate([
                "province_id" => "required|integer",
            ]);
            $province_id = $request->province_id;
            $api_key = '18f28540-8fbc-11ef-839a-16ebf09470c6';

            $ch = curl_init();

            curl_setopt($ch, CURLOPT_URL, "https://online-gateway.ghn.vn/shiip/public-api/master-data/district");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['province_id' => $province_id]));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Token: ' . $api_key,
                'Content-Type: application/json'
            ]);

            $response = curl_exec($ch);
            curl_close($ch);

            $districts = json_decode($response, true)['data'];


            return response()->json([
                "message" => "Lấy dữ liệu thành công",
                "districts" => $districts
            ]);
        } catch (\Exception $ex) {
            return response()->json([
                "message" => $ex->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
    public function getWards(Request $request)
    {
        try {

            $request->validate([
                "district_id" => "required|integer"
            ]);

            $district_id = $request->district_id;
            $api_key = '18f28540-8fbc-11ef-839a-16ebf09470c6';


            $ch = curl_init();

            curl_setopt($ch, CURLOPT_URL, "https://online-gateway.ghn.vn/shiip/public-api/master-data/ward");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['district_id' => $district_id]));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Token: ' . $api_key,
                'Content-Type: application/json'
            ]);

            $response = curl_exec($ch);
            curl_close($ch);

            $wards = json_decode($response, true)['data'];

            return response()->json([
                "message" => "Lấy dữ liệu thành công",
                "wards" => $wards
            ]);
        } catch (\Exception $ex) {
            return response()->json([
                "message" => $ex->getMessage()
            ]);
        }
    }
    // lấy ra các dịch vụ vận chuyển
    public function getAvailableServices($request)
    {
        try {

            $from_district_id = $request["from_district_id"];
            $to_district_id = $request["to_district_id"];
            $weight = $request["weight"];
          
            $api_key = '18f28540-8fbc-11ef-839a-16ebf09470c6';


            $ch = curl_init();

            curl_setopt($ch, CURLOPT_URL, "https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/available-services");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
                'shop_id' => 5404595,  // Thay YOUR_SHOP_ID bằng mã shop GHN của bạn
                'from_district' => $from_district_id,
                'to_district' => $to_district_id,
                'weight' => $weight
            ]));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Token: ' . $api_key,
                'Content-Type: application/json'
            ]);

            $response = curl_exec($ch);
            curl_close($ch);

            $services = json_decode($response, true)['data'][0];
           
            return  $services ;
        } catch (\Exception $ex) {
            return response()->json([
                "message" => $ex->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
    public function calculateShippingFee(Request $request)
    {
        try {
           
            $request->validate([
                "from_district_id" => "required",
                "to_district_id" => "required",
                "weight" => "required", //đơn vị tính g
                
            ]);
            
           
            $from_district_id = $request->from_district_id;
            $to_district_id = $request->to_district_id;
            $weight = $request->weight;
            $services=$this->getAvailableServices($request);
            $service_id = $services["service_id"]; 
            $api_key = '18f28540-8fbc-11ef-839a-16ebf09470c6';
            $ch = curl_init();

            curl_setopt($ch, CURLOPT_URL, "https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
                'service_id' => $service_id,
                
                'from_district_id' => $from_district_id,
                'to_district_id' => $to_district_id,
                'weight' => $weight,
               
            ]));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Token: ' . $api_key,
                'Content-Type: application/json'
            ]);

            $response = curl_exec($ch);
            curl_close($ch);

            $fee = json_decode($response, true)['data'];

            return response()->json([
                "fee" => $fee
            ], Response::HTTP_OK);
        } catch (\Exception $ex) {
            return response()->json([
                "message" => $ex->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}

<?php

namespace App\Http\Controllers\Api\V1\Client;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\ReturnItem;
use App\Models\ReturnLog;
use App\Models\ReturnRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

use function PHPSTORM_META\map;

class ReturnController extends Controller
{

    public function getUserReturnRequests()
    {
        try {
            // Lấy thông tin người dùng hiện tại
            $user = auth()->user();
            // Lấy danh sách return_requests của người dùng hiện tại
            $returnRequests = ReturnRequest::with(["order.orderDetails", 'items'])
                ->where('user_id', $user->id)->latest('id')
                ->get()
                // dd($returnRequests->toArray());
                ->map(function ($returnRequest) {
                    return [
                        'id' => $returnRequest->id,
                        'order_id' => $returnRequest->order_id,
                        'user_id' => $returnRequest->user_id,
                        'reason' => $returnRequest->reason,
                        'status' => $returnRequest->status,
                        'created_at' => $returnRequest->created_at->format('Y-m-d H:i:s'),
                        'updated_at' => $returnRequest->updated_at->format('Y-m-d H:i:s'),

                        'items' => $returnRequest->items->map(function ($item) use ($returnRequest) {
                            return [
                                'id' => $item->id,
                                'request_id' => $item->return_request_id,
                                'order_detail_id' => $item->order_detail_id,
                                'image' => $item->image,
                                'quantity' => $item->quantity,
                                'status' => $item->status,

                                'order' => [
                                    'id' => $returnRequest->order->id,
                                    'total' => $returnRequest->order->total,
                                    'total_quantity' => $returnRequest->order->total_quantity,
                                    'order_status' => $returnRequest->order->order_status,
                                    'order_code' => $returnRequest->order->order_code,
                                    'payment_status' => $returnRequest->order->payment_status,

                                    'order_detail' => $returnRequest->order->orderDetails->map(function ($detail) {
                                        return [
                                            "id" => $detail->id,
                                            "product_id" => $detail->product_id,
                                            "product_variant_id" => $detail->product_variant_id,
                                            "order_id" => $detail->order_id,
                                            "product_name" => $detail->product_name,
                                            "product_img" => $detail->product_img,
                                            "attributes" => $detail->attributes,
                                            "quantity" => $detail->quantity,
                                            "price" => $detail->price,
                                            "total_price" => $detail->total_price,
                                            "discount" => $detail->discount,
                                            "created_at" => $detail->created_at,
                                            "updated_at" => $detail->updated_at,
                                        ];
                                    })


                                ],

                            ];
                        }),
                    ];
                });

            return response()->json([
                'message' => 'User return requests retrieved successfully.',
                'data' => $returnRequests,
            ]);
        } catch (\Exception $ex) {
            return response()->json([
                'message' => 'Error retrieving return requests: ' . $ex->getMessage(),
            ], 500);
        }
    }

    //
    public function createReturnRequest(Request $request)
    {
        try {
            $respone = DB::transaction(function () use ($request) {
                // Validate dữ liệu từ client
                $validated = $request->validate([
                    'order_id' => 'required|exists:orders,id',
                    'items' => 'required|array',
                    'items.*.order_detail_id' => 'required|exists:order_details,id',
                    'items.*.quantity' => 'required|integer|min:1',
                    'reason' => 'required|string',
                ]);

                // Tạo yêu cầu hoàn trả
                $returnRequest = ReturnRequest::create([
                    'order_id' => $validated['order_id'],
                    'user_id' => auth()->id(),
                    'reason' => $validated['reason'],
                    // 'status' => 'pending',
                ]);

                // Duyệt qua từng sản phẩm
                foreach ($validated['items'] as $item) {
                    // Lấy thông tin chi tiết sản phẩm từ bảng order_details
                    $orderDetail = OrderDetail::findOrFail($item['order_detail_id']);

                    // Kiểm tra số lượng yêu cầu hoàn trả không vượt quá số lượng đã mua
                    if ($item['quantity'] > $orderDetail->quantity) {
                        throw new \Exception("Quantity to return for order_detail_id {$item['order_detail_id']} exceeds purchased quantity.");
                    }

                    // Tạo danh sách các item yêu cầu hoàn trả
                    ReturnItem::create([
                        'return_request_id' => $returnRequest->id,
                        'order_detail_id' => $item['order_detail_id'],
                        'quantity' => $item['quantity'],
                        // 'status' => 'pending',
                    ]);
                }
                Order::query()->findOrFail($validated["order_id"])->update([
                    "order_status" => "Yêu cầu hoàn trả hàng"
                ]);

                return [
                    'message' => 'Return request created successfully.',
                    'return_request' => $returnRequest,
                ];
            });
            return response()->json($respone, 201);
        } catch (\Exception $ex) {
            return response()->json([
                "message" => $ex->getMessage()
            ]);
        }
    }

   

    public function cancelReturnRequest(Request $request)
    {
        try {
            $user = auth()->user();

            // Validate dữ liệu
            $validated = $request->validate([
                'return_request_id' => 'required|exists:return_requests,id',
                'cancel_items' => 'nullable|array',
                'cancel_items.*' => 'exists:return_items,id',
            ]);

            // Lấy yêu cầu hoàn trả
            $returnRequest = ReturnRequest::findOrFail($validated['return_request_id']);

            // Kiểm tra quyền hủy
            if ($returnRequest->user_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized action.'], 403);
            }

            // Kiểm tra trạng thái yêu cầu hoàn trả
            if ($returnRequest->status !== 'pending') {
                return response()->json([
                    'message' => 'Only pending return requests can be canceled.'
                ], 400);
            }

            // Lấy các mục cần hủy
            $itemsToCancel = !empty($validated['cancel_items'])
                ? ReturnItem::whereIn('id', $validated['cancel_items'])
                ->where('return_request_id', $returnRequest->id)
                ->where('status', 'pending') // Chỉ cho phép hủy các mục còn đang pending
                ->get()
                : ReturnItem::where('return_request_id', $returnRequest->id)
                ->where('status', 'pending')
                ->get();

            if ($itemsToCancel->isEmpty()) {
                return response()->json([
                    'message' => 'No items to cancel or items are not in pending status.',
                ], 400);
            }

            // Cập nhật trạng thái từng mục
            $canceledItems = [];
            foreach ($itemsToCancel as $item) {
                $item->update(['status' => 'canceled']);
                $canceledItems[] = $item->id;

                // Ghi log
                ReturnLog::create([
                    'return_request_id' => $returnRequest->id,
                    'user_id' => $user->id,
                    'action' => 'canceled',
                    'comment' => "Canceled item ID: {$item->id}",
                ]);
            }

            // Kiểm tra trạng thái toàn bộ yêu cầu
            $remainingItems = ReturnItem::where('return_request_id', $returnRequest->id)
                ->where('status', 'pending')
                ->count();

            if ($remainingItems === 0) {
                // Nếu không còn mục nào ở trạng thái pending, hủy toàn bộ yêu cầu
                $returnRequest->update(['status' => 'canceled']);
                ReturnLog::create([
                    'return_request_id' => $returnRequest->id,
                    'user_id' => $user->id,
                    'action' => 'canceled',
                    'comment' => 'Canceled the entire return request.',
                ]);
                Order::query()->findOrFail($returnRequest->order_id)->update([
                    'order_status'=>"Hoàn thành"
                ]);

            }

            return response()->json([
                'message' => 'Cancellation successful.',
                'canceled_items' => $canceledItems,
                'remaining_items' => $remainingItems,
                'request_status' => $remainingItems === 0 ? 'canceled' : 'partially_canceled',
            ], 200);
        } catch (\Exception $ex) {
            return response()->json([
                "message" => "Error: " . $ex->getMessage()
            ], 500);
        }
    }

    public function getUserReturnItem($id)
    {
        try {

            $returnRequests = ReturnRequest::query()
                ->with(["order.orderDetails", 'items']) // Load quan hệ liên quan
                ->findOrFail($id); // Lấy dữ liệu theo ID, nếu không có thì trả lỗi 404

            // Chuyển đổi dữ liệu
            $result = [
                'id' => $returnRequests->id,
                'order_id' => $returnRequests->order_id,
                'user_id' => $returnRequests->user_id,
                'reason' => $returnRequests->reason,
                'status' => $returnRequests->status,
                'created_at' => $returnRequests->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $returnRequests->updated_at->format('Y-m-d H:i:s'),
                'items' => $returnRequests->items->map(function ($item) use ($returnRequests) {
                    return [
                        'id' => $item->id,
                        'request_id' => $item->return_request_id,
                        'order_detail_id' => $item->order_detail_id,
                        'image' => $item->image,
                        'quantity' => $item->quantity,
                        'status' => $item->status,
                        'order' => [
                            'id' => $returnRequests->order->id,
                            'total' => $returnRequests->order->total,
                            'total_quantity' => $returnRequests->order->total_quantity,
                            'order_status' => $returnRequests->order->order_status,
                            'order_code' => $returnRequests->order->order_code,
                            'payment_status' => $returnRequests->order->payment_status,
                            'order_details' => $returnRequests->order->orderDetails->map(function ($detail) {
                                return [
                                    "id" => $detail->id,
                                    "product_id" => $detail->product_id,
                                    "product_variant_id" => $detail->product_variant_id,
                                    "order_id" => $detail->order_id,
                                    "product_name" => $detail->product_name,
                                    "product_img" => $detail->product_img,
                                    "attributes" => $detail->attributes,
                                    "quantity" => $detail->quantity,
                                    "price" => $detail->price,
                                    "total_price" => $detail->total_price,
                                    "discount" => $detail->discount,
                                    "created_at" => $detail->created_at->format('Y-m-d H:i:s'),
                                    "updated_at" => $detail->updated_at->format('Y-m-d H:i:s'),
                                ];
                            })
                        ],
                    ];
                }),
            ];

            return response()->json([
                'message' => 'Lấy dữ liệu thành công',
                'data' => $result,
            ]);
        } catch (\Exception $ex) {
            return response()->json([
                'message' => 'Error retrieving return requests: ' . $ex->getMessage(),
            ], 500);
        }
    }
}

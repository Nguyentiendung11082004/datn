<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\OrderDetail;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ReturnItem;
use App\Models\ReturnLog;
use App\Models\ReturnRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReturnAdminController extends Controller
{

    public function getReturnRequests(Request $request)
    {
        try {
            // Lấy danh sách return_request cùng các item, đơn hàng và sản phẩm liên quan
            $returnRequests = ReturnRequest::with([
                'items.orderDetail.product', // Thêm chi tiết sản phẩm từ order_detail
                'order'                      // Thông tin đơn hàng
            ])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($returnRequest) {
                    return [
                        'id' => $returnRequest->id,
                        'order_id' => $returnRequest->order_id,
                        'user_id' => $returnRequest->user_id,
                        'reason' => $returnRequest->reason,
                        'status' => $returnRequest->status,
                        'created_at' => $returnRequest->created_at->format('Y-m-d H:i:s'),
                        'updated_at' => $returnRequest->updated_at->format('Y-m-d H:i:s'),
                        'order' => [
                            'id' => $returnRequest->order->id,
                            'total_price' => $returnRequest->order->total_price,
                            'status' => $returnRequest->order->status,
                        ],
                        'items' => $returnRequest->items->map(function ($item) {
                            return [
                                'id' => $item->id,
                                'order_detail_id' => $item->order_detail_id,
                                'quantity' => $item->quantity,
                                'status' => $item->status,
                                'product' => [
                                    'id' => $item->orderDetail->product->id,
                                    'name' => $item->orderDetail->product->name,
                                    'price' => $item->orderDetail->product->price,
                                    'sku' => $item->orderDetail->product->sku,
                                ],
                            ];
                        }),
                    ];
                });

            return response()->json([
                'message' => 'Return requests retrieved successfully.',
                'data' => $returnRequests,
            ], 200);
        } catch (\Exception $ex) {
            return response()->json([
                'message' => $ex->getMessage(),
            ], 500);
        }
    }

    public function updateReturnItemStatus(Request $request, $returnItemId)
    {
        try {

            DB::transaction(function () use ($request, $returnItemId) {
                $user = auth()->user();
                // Validate input
                $validated = $request->validate([
                    'status' => 'required|in:pending,canceled,approved,rejected',
                    'reason' => 'nullable|string', // Lý do từ chối chỉ cần khi trạng thái là "rejected" và khi admin thao tác
                ]);

                // Tìm return_item cần xử lý
                $returnItem = ReturnItem::findOrFail($returnItemId);

                // Lưu lịch sử vào return_log
                $logComment = "Updated status to {$validated['status']}";
                if ($validated['status'] === 'rejected' && $validated['reason']) {
                    // Chỉ ghi lý do từ chối khi trạng thái là "rejected" và khi admin thao tác
                    $logComment .= ". Reason: {$validated['reason']}";
                }

                ReturnLog::create([
                    'return_request_id' => $returnItem->return_request_id,
                    'user_id' => $user->id,
                    'action' => $validated['status'],
                    'comment' => $logComment,
                ]);

                // Nếu trạng thái là "rejected", xử lý lý do và reset số lượng nếu cần
                if ($validated['status'] === 'rejected') {
                    if ($returnItem->status === 'approved') {
                        // Nếu trạng thái trước đó là "approved", reset số lượng trong kho
                        $orderDetail = OrderDetail::findOrFail($returnItem->order_detail_id);
                        $product = Product::findOrFail($orderDetail->product_id);

                        // Trừ số lượng sản phẩm trong kho
                        $product->update([
                            'quantity' => $product->quantity - $returnItem->quantity,
                        ]);
                    }

                    // Lưu lý do vào return_item khi trạng thái là "rejected"
                    $returnItem->update([
                        'status' => 'rejected',
                        'reason' => $validated['reason'], // Lưu lý do từ chối vào return_item
                    ]);
                } else {
                    // Nếu trạng thái là "approved", cộng số lượng vào kho
                    if ($validated['status'] === 'approved') {
                        $orderDetail = OrderDetail::findOrFail($returnItem->order_detail_id);
                        $product = Product::findOrFail($orderDetail->product_id);

                        // Cộng số lượng vào kho
                        $product->update([
                            'quantity' => $product->quantity + $returnItem->quantity,
                        ]);
                    }

                    // Cập nhật trạng thái cho return_item
                    $returnItem->update([
                        'status' => $validated['status'],
                    ]);
                }

                // Tìm return_request liên quan
                $returnRequest = ReturnRequest::findOrFail($returnItem->return_request_id);

                // Kiểm tra trạng thái của tất cả return_item
                $allItemsProcessed = $returnRequest->items()->where('status', 'pending')->count() === 0;
                $allItemsRejected = $returnRequest->items()->where('status', 'approved')->count() === 0;

                if ($allItemsProcessed) {
                    if ($allItemsRejected) {
                        // Nếu tất cả đều bị từ chối
                        $returnRequest->update([
                            'status' => 'rejected',
                        ]);
                    } else {
                        // Nếu có ít nhất một item được chấp nhận
                        $returnRequest->update([
                            'status' => 'completed', // hoặc trạng thái phù hợp
                        ]);
                    }
                }
            });

            return response()->json([
                'message' => 'Return item status updated successfully.',
            ]);
        } catch (\Exception $ex) {
            return response()->json([
                'message' => $ex->getMessage(),
            ], 500);
        }
    }
}

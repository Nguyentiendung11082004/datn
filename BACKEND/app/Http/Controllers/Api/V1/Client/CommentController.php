<?php

namespace App\Http\Controllers\Api\V1\Client;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Comments;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class CommentController extends Controller
{
    /**
     * Hiển thị danh sách bình luận.
     */
    public function index()
    {
        // Lấy tất cả bình luận kèm theo thông tin người dùng và sản phẩm
        $comments = Comments::with('user', 'product')->get();
        return response()->json($comments, Response::HTTP_OK);
    }

    /**
     * Thêm bình luận mới.
     */
    public function store(Request $request)
    {
        // Kiểm tra người dùng đã đăng nhập
        if (!Auth::check()) {
            return response()->json(['message' => 'Bạn cần đăng nhập để có thể bình luận.'], Response::HTTP_UNAUTHORIZED);
        }

        // Xác thực dữ liệu đầu vào
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'content' => 'required|string|max:1000',
            'rating' => 'nullable|integer|min:1|max:5',
            'image' => 'nullable|string',
        ]);

        // Tạo bình luận mới
        $comment = Comments::create([
            'user_id' => Auth::id(),
            'product_id' => $validated['product_id'],
            'content' => $validated['content'],
            'rating' => $validated['rating'],
            'image' => $validated['image'],
            'status' => true, // Mặc định trạng thái bình luận là kích hoạt
        ]);

        return response()->json(['message' => 'Thêm bình luận thành công!', 'comment' => $comment], Response::HTTP_CREATED);
    }

    /**
     * Hiển thị một bình luận cụ thể.
     */
    public function show(string $id)
    {
        $comment = Comments::with('user', 'product')->findOrFail($id);
        return response()->json($comment, Response::HTTP_OK);
    }

    /**
     * Cập nhật bình luận.
     */
    public function update(Request $request, string $id)
    {
        $comment = Comments::findOrFail($id);
    
        // Kiểm tra nếu người dùng hiện tại là chủ sở hữu bình luận
        if ($comment->user_id !== Auth::id()) {
            return response()->json(['message' => 'Không có quyền chỉnh sửa'], Response::HTTP_FORBIDDEN);
        }
    
        // Xác thực dữ liệu đầu vào
        $validated = $request->validate([
            'content' => 'sometimes|required|string|max:1000',
            'rating' => 'nullable|integer|min:1|max:5',
            'image' => 'nullable|string',  // Dữ liệu ảnh có thể null
        ]);
    
        // Cập nhật nội dung bình luận và đánh giá (nếu có)
        $comment->content = $validated['content'] ?? $comment->content;
        $comment->rating = $validated['rating'] ?? $comment->rating;
    
        // Chỉ cập nhật ảnh nếu người dùng gửi ảnh mới
        if ($request->has('image')) {
            $comment->image = $validated['image'];
        }
    
        // Lưu lại các thay đổi
        $comment->save();
    
        return response()->json(['message' => 'Cập nhật bình luận thành công!', 'comment' => $comment], Response::HTTP_OK);
    }
    

    /**
     * Xóa bình luận.
     */
    public function destroy(string $id)
    {
        $comment = Comments::findOrFail($id);

        // Kiểm tra nếu người dùng hiện tại là chủ sở hữu bình luận
        if ($comment->user_id !== Auth::id()) {
            return response()->json(['message' => 'Không có quyền xóa bình luận'], Response::HTTP_FORBIDDEN);
        }

        // Xóa bình luận
        $comment->delete();

        return response()->json(['message' => 'Xóa bình luận thành công!'], Response::HTTP_OK);
    }
}

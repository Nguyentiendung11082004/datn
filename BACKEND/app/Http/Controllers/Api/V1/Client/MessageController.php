<?php

namespace App\Http\Controllers\Api\V1\Client;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class MessageController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Conversation $conversation)
    {
        // Kiểm tra quyền truy cập
        try {
            $user = request()->user();
            if (!$conversation->users->contains($user)) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $messages = $conversation->messages()->with('user')->orderBy('created_at', 'asc')->get();
            return response()->json([
                "message"=>"Lấy dữ liệu thành công",
                "data"=>$messages
            ]);
        } catch (\Exception $ex) {
            return response()->json([
                "message" => $ex->getMessage(),

            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, Conversation $conversation)
    {

        $request->validate([
            'content' => 'required|string',
        ]);

        $user = $request->user();

        // Kiểm tra quyền truy cập
        if (!$conversation->users->contains($user)) {

            return response()->json(['error' => 'Unauthorized'], 403);
        }


        // Tạo tin nhắn mới
        $message = $conversation->messages()->create([
            'user_id' => $user->id,
            'content' => $request->input("content"),
        ]);


        // Phát sự kiện MessageSent
        broadcast(new MessageSent($message))->toOthers();

        return response()->json($message);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}

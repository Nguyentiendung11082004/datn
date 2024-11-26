/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from "@/common/context/Auth/AuthContext";
import instance from "@/configs/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Input, Modal, Table } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import CommentProduct from "../productDetail/CommentProduct";

const HistoryOrder = () => {
  const [expandedOrders, setExpandedOrders] = useState<number[]>([]);
  const [currentCancelOrderId, setCurrentCancelOrderId] = useState<
    number | null
  >(null);
  const [receivedOrders, setReceivedOrders] = useState<number[]>([]);
  const [ratedOrders, setRatedOrders] = useState<number[]>([]);
  const [isCancelPopupOpen, setCancelPopupOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { data, isFetching, isError } = useQuery({
    queryKey: ["history-order"],
    queryFn: async () => {
      const response = await instance.get("/order", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
  });
  const cancelOrder = async ({
    id,
    reason,
  }: {
    id: number;
    reason: string;
  }) => {
    const payload = {
      order_status: "Đã hủy",
      user_note: reason,
    };
    const response = await instance.put(`/order/${id}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  };
  const { mutate } = useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history-order"] });
      toast.success("Đơn hàng đã được hủy thành công!");
      setCancelPopupOpen(false);
    },
    onError: () => {
      toast.error("Hủy đơn hàng thất bại.");
    },
  });
  const toggleOrderDetails = (orderId: number) => {
    setExpandedOrders(
      (prev) =>
        prev.includes(orderId)
          ? prev.filter((id) => id !== orderId) // Nếu đã mở, thì đóng
          : [...prev, orderId] // Nếu chưa mở, thì mở
    );
  };
  // Khởi tạo trạng thái từ localStorage
  useEffect(() => {
    const savedReceivedOrders = JSON.parse(
      localStorage.getItem("receivedOrders") || "[]"
    );
    const savedRatedOrders = JSON.parse(
      localStorage.getItem("ratedOrders") || "[]"
    );

    setReceivedOrders(savedReceivedOrders);
    setRatedOrders(savedRatedOrders);
  }, []);

  // Cập nhật localStorage khi trạng thái thay đổi
  useEffect(() => {
    localStorage.setItem("receivedOrders", JSON.stringify(receivedOrders));
  }, [receivedOrders]);

  useEffect(() => {
    localStorage.setItem("ratedOrders", JSON.stringify(ratedOrders));
  }, [ratedOrders]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const showOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const columns = [
    {
      title: "Mục",
      dataIndex: "label",
      key: "label",
    },
    {
      title: "Thông tin",
      dataIndex: "value",
      key: "value",
    },
  ];
  //  đánh giá sản phẩm
  const [isShowFormCmtOpen, setShowFormCmtOpen] = useState(false);
  const showFormCmt = () => {
    setShowFormCmtOpen(true);
  };
  const closeFormCmt = () => {
    setShowFormCmtOpen(false);
  };

  return (
    <>
      <main
        id="main-content"
        className="min-h-fit !shadow-none !outline-0 block isolate *:box-border"
      >
        <div className="hd-page-head">
          <div className="hd-header-banner bg-[url('./src/assets/images/shopping-cart-head.webp')] bg-no-repeat bg-cover bg-center">
            <div className="hd-bg-banner overflow-hidden relative !text-center bg-black bg-opacity-55 lg:py-[50px] mb-0 py-[30px]">
              <div className="z-[100] relative hd-container text-white">
                <h1 className="text-xl font-medium leading-5 mb-3">
                  Tài khoản
                </h1>
                <p className="text-sm">Lịch sử mua hàng</p>
              </div>
            </div>
          </div>
        </div>
        {/*end hd-page-head*/}
        <div className="hd-account-body max-w-5xl w-full mx-auto px-4 text-[14px] lg:my-[80px] my-[50px]">
          <div className="hd-account-head">
            <div className="max-w-auto">
              <div className="max-w-[42rem]">
                <span className="hd-all-textgrey block mt-4">
                  <span className="text-black font-semibold">Thu Hằng,</span>
                  ha9671889@gmail.com · Hà Nội, Việt Nam
                </span>
              </div>
              <hr className="mt-[1rem] h-0 border-solid border-b-2" />
              <div className="hd-account-menu overflow-x-auto flex uppercase font-medium">
                <Link to="account.html" className="hd-account-menu-item">
                  Thông tin tài khoản
                </Link>
                <Link to="#" className="hd-account-menu-item">
                  Yêu thích
                </Link>
                <Link to="history-order.html" className="hd-account-menu-item">
                  Lịch sử mua hàng
                </Link>
                <Link
                  to="updatepass-account.html"
                  className="hd-account-menu-item"
                >
                  Đổi mật khẩu
                </Link>
              </div>
              <hr className="h-0 border-solid border-b-2" />
            </div>
          </div>
          {/*end hd-account-head*/}
          <div className="hd-account-content pt-[30px] mx-auto">
            <div className="hd-ct-text">
              <h2 className="lg:mb-[50px] mb-[30px] lg:mt-[25px] text-2xl font-semibold uppercase">
                Lịch sử mua hàng
              </h2>

              {data?.map((order: any) => {
                const isExpanded = expandedOrders.includes(order.id); // Kiểm tra xem order có trong danh sách mở
                const isDelivered =
                  order.order_status.toLowerCase() === "giao hàng thành công";
                const isCancelOk =
                  order.order_status.trim().toLowerCase() ===
                    "đang chờ xác nhận" ||
                  order.order_status.trim().toLowerCase() === "đã xác nhận";
                const canCel =
                  order.order_status.trim().toLowerCase() === "đã hủy";

                const handleReceived = (orderId: number) => {
                  if (isCancelOk || canCel) {
                    toast.warning(
                      "Không thể xác nhận nhận hàng ở trạng thái này."
                    );
                    return;
                  }
                  if (!receivedOrders.includes(orderId)) {
                    setReceivedOrders((prev) => [...prev, orderId]);
                    toast.success("Đơn hàng đã được xác nhận là đã nhận.");
                  } else {
                    toast.warning("Đơn hàng này đã được xác nhận trước đó.");
                  }
                };

                const handleRated = (orderId: number) => {
                  if (!receivedOrders.includes(orderId)) {
                    toast.warn(
                      "Vui lòng xác nhận đã nhận hàng trước khi đánh giá."
                    );
                    return;
                  }

                  if (!ratedOrders.includes(orderId)) {
                    setRatedOrders((prev) => [...prev, orderId]);
                    toast.success("Cảm ơn bạn đã đánh giá sản phẩm!");
                  } else {
                    toast.warning("Bạn đã đánh giá đơn hàng này trước đó.");
                  }
                };

                const handleCancelClick = (id: number, status: string) => {
                  if (!isCancelOk) {
                    toast.warning(
                      "Không thể hủy đơn hàng ở trạng thái hiện tại!"
                    );
                    return;
                  }

                  setCurrentCancelOrderId(id);
                  setCancelPopupOpen(true);
                };

                const handleConfirmCancel = () => {
                  if (!cancelReason.trim()) {
                    toast.error("Vui lòng nhập lý do hủy đơn hàng.");
                    return;
                  }

                  if (currentCancelOrderId !== null) {
                    // Chỉ hủy đơn hàng với ID được chọn
                    mutate({ id: currentCancelOrderId, reason: cancelReason });
                    // setCancelReason("");
                    // Xóa lý do sau khi hủy
                  }
                };

                return (
                  <div
                    key={order.id}
                    onClick={() => toggleOrderDetails(order.id)}
                    className="border border-slate-200 rounded-lg overflow-hidden z-0 mb-[30px]"
                  >
                    <button className="hd-head-form-order w-full flex sm:flex-row justify-between lg:justify-between sm:justify-between sm:items-center p-4 sm:p-8 bg-slate-50 dark:bg-slate-500/5">
                      <div className="flex items-center">
                        <button
                          onClick={() => toggleOrderDetails(order.id)}
                          className="text-base"
                        >
                          {isExpanded ? "▼" : "▲"}
                          {/* Hiển thị mũi tên lên hoặc xuống */}
                        </button>
                        <p className="text-base font-semibold mx-2">
                          {order.order_code}
                        </p>
                        <p className="text-2xl relative mr-2">|</p>
                        <span className="text-[#00BADB] uppercase font-medium text-base">
                          {order.order_status}
                        </span>
                      </div>
                      <div className="">
                        <button
                          onClick={() => showOrderDetails(order)}
                          className="nc-Button border relative h-auto inline-flex items-center justify-center rounded-full transition-colors hover:font-medium py-2.5 px-4 sm:px-6 ttnc-ButtonSecondary dark:bg-[#00BADB] dark:text-white bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-6000 dark:focus:ring-offset-0"
                        >
                          Xem chi tiết
                        </button>
                        {selectedOrder && (
                          <Modal
                            // title={`Chi tiết đơn hàng`}
                            open={isModalOpen}
                            onCancel={handleModalClose}
                            footer={null}
                            className="-mt-10"
                            width={1000}
                          >
                            <div className="text-lg uppercase font-medium flex">
                              <p>Mã đơn hàng . {selectedOrder.order_code}</p>
                              <p className="mx-2">|</p>
                              <p className="text-[#00BADB]">
                                {selectedOrder.order_status}
                              </p>
                            </div>
                            <p>
                              <strong>Thời gian đặt hàng:</strong>
                              {selectedOrder.created_at}
                            </p>
                            <p>
                              <strong>Trạng thái đơn hàng:</strong>
                              {selectedOrder.order_status}
                            </p>
                            <p>
                              <strong>Địa chỉ nhận hàng:</strong>
                              <br />
                              Tên: {selectedOrder.ship_user_name}
                              <br />
                              Số điện thoại:
                              {selectedOrder.ship_user_phonenumber}
                              <br />
                              Địa chỉ: {selectedOrder.ship_user_address}
                            </p>
                            <div>
                              <strong>Sản phẩm:</strong>
                              {selectedOrder.order_details.map((item: any) => (
                                <div
                                  key={item.id}
                                  className="flex items-center space-x-4 border-b pb-2 mb-2"
                                >
                                  <img
                                    src={item.product_img}
                                    alt={item.product_name}
                                    className="w-16 h-16 object-cover"
                                  />
                                  <div>
                                    <p className="font-semibold">
                                      {item.product_name}
                                    </p>
                                    <p>
                                      {item.attributes &&
                                        Object.entries(item.attributes).length >
                                          0 && (
                                          <>
                                            Phân loại hàng:
                                            {Object.entries(
                                              item.attributes
                                            ).map(([key, value]) => (
                                              <li key={key}>
                                                {Array.isArray(value)
                                                  ? value.join(", ") // Nếu là mảng
                                                  : typeof value === "object" &&
                                                      value !== null
                                                    ? Object.values(value).join(
                                                        ", "
                                                      ) // Nếu là object
                                                    : String(value)}
                                                {/* Nếu là giá trị đơn lẻ */}
                                              </li>
                                            ))}
                                          </>
                                        )}
                                    </p>
                                    <p>Số lượng: {item.quantity}</p>
                                    <p>
                                      Giá:
                                      {/* {FormatMoney(item.price)} */}
                                      {new Intl.NumberFormat("vi-VN").format(
                                        item.price
                                      )}
                                      ₫
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Dùng Table hiển thị thông tin */}
                            <Table
                              dataSource={[
                                {
                                  key: "1",
                                  label: "Phí vận chuyển",
                                  value: `
                                 
                                  ₫`,
                                },
                                {
                                  key: "2",
                                  label: "Khuyến mãi",
                                  value:
                                    // `-${FormatMoney(selectedOrder.voucher_discount)}₫`
                                    `${new Intl.NumberFormat("vi-VN").format(selectedOrder.voucher_discount)}₫`,
                                },
                                {
                                  key: "3",
                                  label: "Thành tiền",
                                  value:
                                    // `${FormatMoney(selectedOrder.total)}₫`
                                    `${new Intl.NumberFormat("vi-VN").format(selectedOrder.total)}₫`,
                                },
                                {
                                  key: "4",
                                  label: "Phương thức thanh toán",
                                  value: `${selectedOrder.payment_method.name} - ${selectedOrder.payment_method.description}`,
                                },
                              ]}
                              columns={columns}
                              pagination={false}
                              bordered
                            />
                          </Modal>
                        )}
                      </div>
                    </button>
                    {/*end hd-head-form-order*/}
                    {isExpanded && (
                      <div className="hd-body-form-order border-b border-t border-slate-200 p-2 sm:p-8 divide-y divide-y-slate-20">
                        {order.order_details.map((detail: any) => (
                          <div
                            className="flex py-4 sm:py-7 last:pb-0 first:pt-0"
                            key={detail.id}
                          >
                            <div className="relative h-[88px] w-16 sm:w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                              <img
                                alt={detail.product_name}
                                loading="lazy"
                                decoding="async"
                                data-nimg="fill"
                                className="block absolute align-middle inset-0 h-full w-full object-cover object-center"
                                sizes="100px"
                                src={detail.product_img}
                              />
                            </div>
                            <div className="ml-4 flex flex-1 flex-col">
                              <div>
                                <div className="flex justify-between">
                                  <div>
                                    <h3 className="text-lg font-medium line-clamp-1">
                                      {detail.product_name}
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                      {detail.attributes &&
                                        Object.entries(detail.attributes)
                                          .length > 0 && (
                                          <>
                                            Phân loại hàng:
                                            {Object.entries(
                                              detail.attributes
                                            ).map(([key, value]) => (
                                              <li key={key}>
                                                {Array.isArray(value)
                                                  ? value.join(", ") // Nếu là mảng
                                                  : typeof value === "object" &&
                                                      value !== null
                                                    ? Object.values(value).join(
                                                        ", "
                                                      ) // Nếu là object
                                                    : String(value)}
                                                {/* Nếu là giá trị đơn lẻ */}
                                              </li>
                                            ))}
                                          </>
                                        )}
                                    </p>
                                  </div>
                                  <div className="mt-[1.7px]">
                                    <div className="flex items-center text-sm font-medium">
                                      {/* <del className="mr-1">{detail.price}đ</del> */}
                                      <span className="text-base">
                                        {/* {FormatMoney(detail.price)}₫ */}
                                        {new Intl.NumberFormat("vi-VN").format(
                                          detail.price
                                        )}
                                        ₫
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-1 items-end justify-between text-sm">
                                <p className="text-gray-500 dark:text-slate-400 flex items-center">
                                  <span className="inline-block">x</span>
                                  <span className="ml-2">
                                    {detail.quantity}
                                  </span>
                                </p>
                                {/* đánh giá  */}
                                {/* <div className="flex">
                                  
                                  <button
                                    type="button"
                                    className={`font-medium ${
                                      isDelivered
                                        ? "hd-all-hover-bluelight"
                                        : "text-gray-400 cursor-pointer"
                                    }`}
                                    onClick={() => {
                                      if (!isReceived) {
                                        toast.warn(
                                          "Vui lòng xác nhận đã nhận hàng trước"
                                        );
                                      } else {
                                        alert("đánh giá sản phẩm");
                                        setIsRated(true);
                                      }
                                    }}
                                  >
                                    Đánh Giá
                                  </button>
                                </div> */}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/*end hd-body-form-order*/}
                    <div className="hd-head-form-order flex sm:flex-row justify-between lg:justify-between sm:justify-between sm:items-center p-4 sm:p-8">
                      <div className="mt-3 sm:mt-0">
                        {ratedOrders.includes(order.id) ? (
                          <button className="nc-Button mr-3 relative h-auto inline-flex items-center justify-center rounded-full transition-colors text-sm py-2.5 px-4 sm:px-6 ttnc-ButtonSecondary bg-[#00BADB] text-white">
                            Mua Lại
                          </button>
                        ) : (
                          <>
                            <button
                              className={`nc-Button mr-3 relative h-auto inline-flex items-center justify-center rounded-full transition-colors text-sm  py-2.5 px-4 sm:px-6 ttnc-ButtonSecondary  ${
                                isDelivered
                                  ? "bg-[#00BADB] text-white font-medium"
                                  : "bg-gray-200 text-slate-400 cursor-pointer border border-gray-300"
                              }
                              
                            `}
                              onClick={() => handleReceived(order.id)}
                              disabled={canCel}
                            >
                              {receivedOrders.includes(order.id)
                                ? "Đã Nhận Được Hàng"
                                : "Đã Nhận Hàng"}
                            </button>
                            {/* {!isCancelOk && !canCel && (
                              <button
                                type="button"
                                className={`nc-Button mr-3 relative h-auto inline-flex items-center justify-center rounded-full transition-colors text-sm py-2.5 px-4 sm:px-6 ttnc-ButtonSecondary text-slate-700 
                                  ${
                                  !ratedOrders.includes(order.id)
                                    ? "bg-[#00BADB] text-white font-medium"
                                    : "bg-gray-200 text-slate-400 cursor-not-allowed border border-gray-300"
                                }`
                              }
                                onClick={() => handleRated(order.id)}
                                disabled={ratedOrders.includes(order.id)}
                              >
                                Đánh Giá
                              </button>
                            )} */}
                            
                            <button
                              type="button"
                              className={`nc-Button mr-3 relative h-auto inline-flex items-center justify-center rounded-full transition-colors text-sm py-2.5 px-4 sm:px-6 ttnc-ButtonSecondary
                                bg-[#00BADB] text-white font-medium 
                                `}
                              onClick={() => showFormCmt()}
                            >
                              Đánh giá
                            </button>
                            <Modal
                              title="Thêm đánh giá"
                              visible={isShowFormCmtOpen}
                              onCancel={closeFormCmt}
                              footer={null} // Xóa nút footer mặc định
                              centered
                            >
                              <CommentProduct
                                // productId={order?.id}
                                productId={(() => {
                                  console.log("Order ID:", order?.id);
                                  return order?.id;
                                })()}
                                editIdComment={null} // Giá trị mặc định
                                InForCommentId={null} // Giá trị mặc định
                                setInForCommentId={() => {}} // Hàm rỗng hoặc logic bạn cần
                                setEditIdComment={() => {}}
                              />
                            </Modal>
                          </>
                        )}

                        <button
                          className={`nc-Button relative h-auto inline-flex items-center justify-center rounded-full transition-colors text-sm py-2.5 px-4 sm:px-6 ttnc-ButtonSecondary ${
                            isCancelOk
                              ? "bg-[#00BADB] text-white font-medium"
                              : "bg-gray-200 text-slate-400 border cursor-pointer border-gray-300"
                          }`}
                          onClick={() =>
                            handleCancelClick(order.id, order.order_status)
                          }
                          disabled={canCel}
                        >
                          Xác nhận hủy
                        </button>
                        <Modal
                          title="Lý do hủy đơn hàng"
                          open={isCancelPopupOpen}
                          onOk={handleConfirmCancel}
                          onCancel={() => setCancelPopupOpen(false)}
                          okText="Gửi"
                          cancelText="Hủy"
                        >
                          <Input.TextArea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Nhập lý do hủy..."
                            rows={4}
                          />
                        </Modal>
                      </div>
                      <div className="flex items-center">
                        <p className="mr-2">Thành tiền: </p>
                        <span className="text-[red] font-medium text-xl">
                          {/* {FormatMoney(order.total)}đ */}
                          {new Intl.NumberFormat("vi-VN").format(order.total)}₫
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/*end hd-account-content*/}
        </div>
        {/*end hd-account-body*/}
      </main>
    </>
  );
};

export default HistoryOrder;

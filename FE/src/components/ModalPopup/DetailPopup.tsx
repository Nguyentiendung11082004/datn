/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormatMoney } from "@/common/utils/utils";
import HeartBlack from "@/components/icons/detail/HeartBlack";
import { CloseOutlined, MinusOutlined } from "@ant-design/icons";
import { Modal as AntModal, Button } from "antd";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

type Props = {
  open: boolean;
  onClose: () => void;
  trendProducts: any;
  productSeeMore: any;
};
const MySwal = withReactContent(Swal);
const DetailPopup = ({ open, onClose, productSeeMore }: Props) => {
  const navigate = useNavigate();
  const resultDataAttribute = Object.entries(
    productSeeMore?.unique_attributes ?? {}
  ).map(([key, value]) => ({
    attribute: key,
    attributeValue: Object.entries(value ?? {}).map(([id, name]) => ({
      id,
      name,
    })),
  }));
  const priceProduct = productSeeMore?.variants?.map((e: any) => e?.price_sale);
  const minPrice =
    priceProduct && priceProduct.length > 0 ? Math.min(...priceProduct) : null;
  const maxPrice =
    priceProduct && priceProduct.length > 0 ? Math.max(...priceProduct) : null;
  const _payload = {
    product_id: productSeeMore.id,
    product_variant_id: productSeeMore?.variants?.map((e: any) => e.id)?.[0],
    quantity: 1,
  };

  const handleCheckout = () => {
    navigate("/checkout", { state: { _payload: _payload } });
  };

  return (
    <AntModal
      open={open}
      onCancel={onClose}
      footer={false}
      closable={false}
      maskClosable={false}
      className="rounded-xl"
      width={1100}
    >
      <div className="flex">
        {/* Nút đóng ở góc phải */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 text-white hover:bg-[#56cfe1] bg-black px-3 pt-3 pb-2"
        >
          <CloseOutlined className="text-lg" />
        </button>
        {/* Khung chứa ảnh */}
        <div className="w-1/2 relative">
          <div className="absolute w-full flex items-center justify-between top-[50%]">
            {/* <PreImg />
            <NextImg /> */}
          </div>
          <img
            src={`${productSeeMore.img_thumbnail}`}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="w-1/2 p-2 ml-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {productSeeMore?.name}
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-xl text-[#696969]">
              {minPrice !== null && maxPrice !== null
                ? `${FormatMoney(minPrice)} - ${FormatMoney(maxPrice)}`
                : FormatMoney(productSeeMore?.price_sale || 0)}
            </span>
            <div className="flex items-center">
              <Link
                to="#reviews"
                className="flex items-center text-sm font-medium"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  data-slot="icon"
                  className="w-5 h-5 pb-[1px] text-yellow-400"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  data-slot="icon"
                  className="w-5 h-5 pb-[1px] text-yellow-400"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  data-slot="icon"
                  className="w-5 h-5 pb-[1px] text-yellow-400"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  data-slot="icon"
                  className="w-5 h-5 pb-[1px] text-yellow-400"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  data-slot="icon"
                  className="w-5 h-5 pb-[1px] text-gray-300"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                <div className="ml-1.5 text-[#696969]">
                  (<span>7</span> lượt đánh giá)
                </div>
              </Link>
            </div>
          </div>
          <p className="mt-4 hd-all-text grey  mb-3">
            {productSeeMore?.description}
          </p>

          {/* Chọn màu */}
          {resultDataAttribute?.map((e) => (
            <div className="my-4" key={e?.attribute}>
              <p className="font-medium">{e?.attribute}</p>
              <div className="flex mt-3 gap-2">
                {e?.attributeValue?.map((item: any) =>
                  e.attribute.toLowerCase() === "color" ? (
                    <div
                      key={item.id}
                      className="flex-1 max-w-[75px] h-8 sm:h-8 rounded-full border-2 cursor-pointer "
                      style={{ backgroundColor: item.name.toLowerCase() }}
                    ></div>
                  ) : (
                    <p
                      key={item.id}
                      className="text-center  flex-1 max-w-[75px] pt-1 sm:h-8 rounded-full border-2 cursor-pointer items-center justify-center h-full text-sm"
                    >
                      {item.name}
                    </p>
                  )
                )}
              </div>
            </div>
          ))}
          {/* <div className="my-4">
            <p className="font-medium">'Màu sắc '</p>
            <div className="flex mt-3 gap-2">
              {["Red", "Blue", "Green"].map((color: any) => (
                <div
                  key={color}
                  className={`relative flex-1 max-w-[75px] h-8 sm:h-8 rounded-full border-2 cursor-pointer ${selectedColor === color ? "border-black" : ""
                    }`}
                  style={{ backgroundColor: color.toLowerCase() }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div> */}

          {/* Chọn kích thước */}
          {/* <div className="mb-6">
            <p className="font-medium">Kích thước</p>
            <div className="flex mt-3 gap-2">
              {["S", "M", "L"].map((size: any) => (
                <button
                  key={size}
                  className={`relative flex-1 max-w-[75px] h-8 sm:h-8 rounded-full border-2 cursor-pointer ${selectedSize === size ? "border-black bg-gray-100" : ""
                    }`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div> */}

          <div className="hd-quantity-item flex items-center">
            <div className="hd-quantity relative block min-w-[120px] w-[120px] h-10 hd-all-btn">
              <button
                type="button"
                className="hd-btn-item left-0 text-left pl-[15px] p-0 top-0 text-sm cursor-pointer shadow-none transform-none touch-manipulation"
              >
                <MinusOutlined />
              </button>
              <span className="select-none leading-9 cursor-text font-semibold text-base">
                1
              </span>
              <button
                type="button"
                className="hd-btn-item right-0 text-right pr-[15px] p-0 top-0 text-sm cursor-pointer shadow-none transform-none touch-manipulation"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="size-3 hd-all-hover-bluelight"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </button>
            </div>
            {/* Nút Add to Cart */}
            <div className="mx-3">
              <Button
                // onClick={handleClose}
                className="w-full h-11 rounded-full  bg-[#56cfe1] text-white text-base font-medium hover:bg-[#4bc3d5]"
              >
                Thêm vào giỏ hàng
              </Button>
            </div>

            <div className="mt-2">
              <button>
                <HeartBlack />
                {/* <HeartRedPopup /> */}
              </button>
            </div>
          </div>
          <div className="my-5">
            <Button
              onClick={handleCheckout}
              className="w-full h-11 rounded-full  bg-black text-white text-lg font-medium hover:bg-[#4bc3d5]"
            >
              Mua ngay
            </Button>
          </div>
          <div className="flex">
            <p className="mr-1 font-medium">Xem chi tiết</p>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              className="size-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3"
              />
            </svg>
          </div>
        </div>
      </div>
    </AntModal>
  );
};

export default DetailPopup;

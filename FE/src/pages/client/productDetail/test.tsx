/* eslint-disable @typescript-eslint/no-explicit-any */
import Less from "../../../components/icons/detail/Less";
import { Link, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Iproduct } from "@/common/types/products";
import { useQuery } from "@tanstack/react-query";
import { productShow } from "@/services/api/admin/products.api";
import RelatedProducts from "./RelatedProducts";
import { categoriesShow } from "@/services/api/admin/categories";
import CommentPageDetail from "./CommentPageDetail";
import { Skeleton } from "antd";
import ProductAtributes from "./ProductAttributes";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Iproduct>();
  const [selectedImage, setSelectedImage] = useState<string | undefined>(
    undefined
  );
  const {
    data: productData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      try {
        return await productShow(`${id}`);
      } catch (error) {
        throw new Error("Failed to fetch product details.");
      }
    },
  });
  console.log("data : ", productData);

  useEffect(() => {
    if (productData && productData.product) {
      setProduct(productData.product);
      setSelectedImage(productData.product.img_thumbnail);
    }
  }, [productData]);

  const categoryId = product?.category_id;

  const { data: categoryData } = useQuery({
    queryKey: ["category", categoryId],
    queryFn: async () => {
      if (!categoryId) return null;
      return await categoriesShow(`${categoryId}`);
    },
  });

  const categoryName = categoryData?.name || "";

  // Slideshow
  const imgRef = useRef<HTMLImageElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const img = imgRef.current;
    if (img) {
      const rect = img.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const xPercent = (x / rect.width) * 100;
      const yPercent = (y / rect.height) * 100;
      img.style.transformOrigin = `${xPercent}% ${yPercent}%`;
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      containerRef.current.scrollTop += e.deltaY;
    }
  };

  const [activeButton, setActiveButton] = useState("details");

  const handleButtonClick = (buttonName: string) => {
    setActiveButton(buttonName);
  };

  const handleGalleryClick = (image: string) => {
    setSelectedImage(image);
  };

  const galleryImages = product?.galleries || [];
  const mainImage = product?.img_thumbnail;

  if (mainImage && !galleryImages.some((img) => img.image === mainImage)) {
    galleryImages.push({ id: 0, image: mainImage });
  }

  // thêm vào giỏ hàng
  const [quantity, setQuantity] = useState<number>(1);

  const increaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  if (isLoading) return <Skeleton className="container py-10 lg:flex" />;
  if (isError) return <p>{error.message}</p>;

  return (
    <>
      <div>
        <div className="hd-detail-head bg-[#f6f6f6]">
          <div className="container h-[55px] flex items-center">
            <span className="text-[13px]">Trang chủ</span>
            <Less />
            <Link to="">
              <span className="text-[13px] text-[#222]">{categoryName}</span>
            </Link>
            <Less />
            <span className="text-[13px] text-gray-500">{product?.name}</span>
          </div>
        </div>

        <div className="container py-10 lg:flex">
          <div className="w-full lg:w-[55%] ">
            <div className="lg:flex lg:gap-3">
              <div className="lg:w-4/5 h-full w-full lg:order-2">
                <div
                  className="group lg:w-[550px] lg:h-[600px] h-full relative overflow-hidden"
                  onMouseMove={handleMouseMove}
                >
                  <img
                    ref={imgRef}
                    alt="product detail"
                    loading="lazy"
                    decoding="async"
                    data-nimg="fill"
                    className="w-full lg:h-[100%] h-full lg:w-[550px] object-cover transition-transform ease-in-out duration-300 group-hover:scale-150"
                    sizes=""
                    src={selectedImage}
                  />
                </div>
              </div>

              {/* galleries */}
              <div
                className="lg:order-1 hd-img-soft lg:w-1/5 w-full lg:h-[600px] max-h-[600px] overflow-x-auto lg:overflow-y-auto flex lg:flex-col flex-row"
                onWheel={handleWheel}
                ref={containerRef}
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                <style>
                  {`.hd-img-soft::-webkit-scrollbar {display: none;}`}
                </style>
                {galleryImages.length > 0 ? (
                  galleryImages.map((value) => (
                    <img
                      key={value.id}
                      alt={`Gallery image ${value.id}`}
                      loading="lazy"
                      decoding="async"
                      className="w-24 h-[150px] lg:w-auto flex-shrink-0 cursor-pointer"
                      src={value.image}
                      onClick={() => handleGalleryClick(value.image)}
                    />
                  ))
                ) : (
                  <img src="" alt="" />
                )}
              </div>
              {/* end galleries */}
            </div>
          </div>

          <div className="w-full lg:w-[45%] pt-10 lg:pt-0 lg:pl-7 xl:pl-9 2xl:pl-10 ">
            <div className="h-full">
              <div>
                <h2 className="text-[16px] xl:text-start sm:text-center sm:text-3xl font-bold mb-3 ">
                  {product?.name}
                </h2>
                <div className="flex items-center mt-5 lg:mx-[15%] sm:mx-[42%] xl:mx-0 sm:mt-2 space-x-4">
                  <div className="">
                    <span className="lg:text-xl  sm:text-[25px] text-lg text-[#747474] my-2">
                      {product?.price_regular} VNĐ
                    </span>
                  </div>
                  <div className="h-7 border-l border-slate-300 dark:border-slate-700 lg:block xl:block block sm:hidden"></div>
                  <div className="flex items-center lg:block xl:block sm:hidden">
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
                      <div className="ml-1.5 flex">
                        <span>4</span>
                        <span className="block mx-2">·</span>
                      </div>
                    </Link>
                  </div>
                </div>
                <p className="mt-4 hd-all-text grey  mb-3">
                  {product?.description_title}
                </p>
              </div>

              <ProductAtributes product={productData} />
              <div className="font-medium mt-2 mb-2">số lượng: </div>

              <div className="flex space-x-3.5 items-center lg:ml-0 sm:ml-[40px]">
                <div className="flex items-center  justify-center sm:pr-3.5 rounded-full">
                  <div className="nc-NcInputNumber flex items-center justify-between space-x-3 w-full border border-black px-2 py-2 rounded-full">
                    <div className="nc-NcInputNumber__content flex items-center justify-between w-[104px] sm:w-28 ">
                      <button
                        className="flex items-center justify-center bg-slate-100/70 focus:outline-none hover:border-neutral-700 dark:hover:border-neutral-400 disabled:hover:border-neutral-400 dark:disabled:hover:border-neutral-500 disabled:opacity-50 disabled:cursor-default"
                        type="button"
                        onClick={decreaseQuantity}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                          data-slot="icon"
                          className="w-4 h-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.25 12a.75.75 0 0 1 .75-.75h14a.75.75 0 0 1 0 1.5H5a.75.75 0 0 1-.75-.75Z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      </button>
                      <span className="select-none block flex-1 text-center font-semibold">
                        {quantity}
                      </span>
                      <button
                        className="flex items-center justify-center bg-white focus:outline-none hover:border-neutral-700 dark:hover:border-neutral-400 disabled:hover:border-neutral-400 dark:disabled:hover:border-neutral-500 disabled:opacity-50 disabled:cursor-default"
                        type="button"
                        onClick={increaseQuantity}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                          data-slot="icon"
                          className="w-4 h-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <button className="h-11 w-full   px-2 py-2 rounded-full test nc-Button relative right-2  inline-flex items-center justify-center  text-sm sm:text-base font-medium sm:py-3.5 sm:px-2 lg:px-2 shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-6000 dark:focus:ring-offset-0  animate-bounce focus:animate-none hover:animate-none text-md  mt-3  border bg-[#56cfe1] text-white">
                  <svg
                    className="hidden lg:hidden xl:block sm:inline-block w-5 h-5 mb-0.5"
                    viewBox="0 0 9 9"
                    fill="none"
                  >
                    <path
                      d="M2.99997 4.125C3.20708 4.125 3.37497 4.29289 3.37497 4.5C3.37497 5.12132 3.87865 5.625 4.49997 5.625C5.12129 5.625 5.62497 5.12132 5.62497 4.5C5.62497 4.29289 5.79286 4.125 5.99997 4.125C6.20708 4.125 6.37497 4.29289 6.37497 4.5C6.37497 5.53553 5.5355 6.375 4.49997 6.375C3.46444 6.375 2.62497 5.53553 2.62497 4.5C2.62497 4.29289 2.79286 4.125 2.99997 4.125Z"
                      fill="currentColor"
                    ></path>

                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M6.37497 2.625H7.17663C7.76685 2.625 8.25672 3.08113 8.29877 3.66985L8.50924 6.61641C8.58677 7.70179 7.72715 8.625 6.63901 8.625H2.36094C1.2728 8.625 0.413174 7.70179 0.490701 6.61641L0.70117 3.66985C0.743222 3.08113 1.23309 2.625 1.82331 2.625H2.62497L2.62497 2.25C2.62497 1.21447 3.46444 0.375 4.49997 0.375C5.5355 0.375 6.37497 1.21447 6.37497 2.25V2.625ZM3.37497 2.625H5.62497V2.25C5.62497 1.62868 5.12129 1.125 4.49997 1.125C3.87865 1.125 3.37497 1.62868 3.37497 2.25L3.37497 2.625ZM1.82331 3.375C1.62657 3.375 1.46328 3.52704 1.44926 3.72328L1.2388 6.66985C1.19228 7.32107 1.70805 7.875 2.36094 7.875H6.63901C7.29189 7.875 7.80766 7.32107 7.76115 6.66985L7.55068 3.72328C7.53666 3.52704 7.37337 3.375 7.17663 3.375H1.82331Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                  <span className="xl:ml-3 ml-1 lg:text-base xl:text-base">
                    Thêm vào giỏ hàng
                  </span>
                </button>
                <br />
                <div className="flex border border-slate-600 rounded-full items-center px-2 h-10 hover:border-red-500 hover:text-red-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    className="size-6 "
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                    />
                  </svg>
                </div>
              </div>
              {/* mua ngay */}
              <button className=" nc-Button relative right-2 h-11 w-full inline-flex items-center justify-center rounded-full text-sm sm:text-base font-medium sm:py-3.5 sm:px-2 lg:px-2 shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-6000 dark:focus:ring-offset-0 text-md mt-3 border bg-[#222222] text-white">
                <span className="xl:ml-3 ml-1 lg:text-base xl:text-base">
                  Mua ngay
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* chi tiết */}

        <div className="w-full bg-[#f6f6f8]">
          <div className="container py-[45px]">
            <div className="w-[100%] text-center m-auto flex justify-center">
              <button
                onClick={() => handleButtonClick("details")}
                className={`${
                  activeButton === "details"
                    ? "border-black text-black border-2"
                    : " text-[#8e8e8e]"
                } font-medium cursor-pointer lg:text-base text-[10px] lg:py-2 lg:px-6 px-2 py-2 rounded-full`}
              >
                Chi tiết sản phẩm
              </button>
              <button
                onClick={() => handleButtonClick("reviews")}
                className={`${
                  activeButton === "reviews"
                    ? "border-black text-black border-2"
                    : "border-black text-[#8e8e8e]"
                } btn_cmt text-[10px] lg:text-base font-medium cursor-pointer lg:py-2 lg:px-6 px-2 py-2 rounded-full`}
              >
                Xem đánh giá sản phẩm
              </button>
              <button
                onClick={() => handleButtonClick("comment")}
                className={`${
                  activeButton === "comment"
                    ? "border-black text-black border-2"
                    : "border-black text-[#8e8e8e]"
                } btn_cmt text-[10px] lg:text-base font-medium cursor-pointer lg:py-2 lg:px-6 px-2 py-2 rounded-full`}
              >
                Viết bình luận
              </button>
            </div>

            <div className="mt-[20px] w-full">
              {activeButton === "details" && (
                <div className="detail_pageDetail flex flex-col lg:text-base text-[10px]">
                  <p className="py-2 relative">
                    <span className="text-[#9b9791] mr-[200px]">Danh mục:</span>
                    <span className="absolute left-[200px] font-medium">
                      {categoryName}
                    </span>
                  </p>
                  <p className="py-2 relative">
                    <span className="text-[#9b9791] mr-[200px]">
                      Mã sản phẩm:
                    </span>
                    <span className="absolute left-[200px] font-medium">
                      {product?.sku}
                    </span>
                  </p>
                  <p className="py-2 relative">
                    <span className="text-[#9b9791] mr-[200px]">
                      Tình trạng:
                    </span>
                    <span className="absolute left-[200px] font-medium">
                      {product && product.quantity > 0 ? (
                        <span className="">Còn hàng</span>
                      ) : (
                        <span className="">Hết hàng</span>
                      )}
                    </span>
                  </p>
                  <p className="py-2 relative">
                    <span className="text-[#9b9791] mr-[200px]">
                      Thương hiệu:
                    </span>
                    <span className="absolute left-[200px] font-medium">
                      {(product as any)?.brand?.name || ""}
                    </span>
                  </p>

                  <div className="w-full mt-4">
                    <h1 className="font-semibold text-xl pb-2">
                      Mô tả sản phẩm: {product?.description_title}
                    </h1>
                    <p>{product?.description}</p>
                  </div>
                </div>
              )}
              {activeButton === "reviews" && (
                <div className="w-full">
                  <div>
                    <div>
                      <CommentPageDetail productId={Number(product!.id)} />
                    </div>
                  </div>
                </div>
              )}
              {activeButton === "comment" && (
                <form className="m-auto w-full max-w-lg p-6 bg-white shadow-lg rounded-lg">
                  <h1 className="font-semibold lg:text-2xl text-base mb-4 text-center">
                    Đánh giá sản phẩm
                  </h1>

                  <div className="mb-4">
                    <label
                      className="block lg:text-sm text-[10px] font-medium text-gray-700"
                      htmlFor="rating"
                    >
                      Chất lượng sản phẩm:
                    </label>
                    <div className="flex items-center mt-2">
                      <input
                        type="radio"
                        id="star5"
                        name="rating"
                        value="5"
                        className="hidden"
                      />
                      <label
                        htmlFor="star5"
                        className="cursor-pointer text-yellow-500"
                      >
                        ★
                      </label>
                      <input
                        type="radio"
                        id="star4"
                        name="rating"
                        value="4"
                        className="hidden"
                      />
                      <label
                        htmlFor="star4"
                        className="cursor-pointer text-yellow-500"
                      >
                        ★
                      </label>
                      <input
                        type="radio"
                        id="star3"
                        name="rating"
                        value="3"
                        className="hidden"
                      />
                      <label
                        htmlFor="star3"
                        className="cursor-pointer text-yellow-500"
                      >
                        ★
                      </label>
                      <input
                        type="radio"
                        id="star2"
                        name="rating"
                        value="2"
                        className="hidden"
                      />
                      <label
                        htmlFor="star2"
                        className="cursor-pointer text-yellow-500"
                      >
                        ★
                      </label>
                      <input
                        type="radio"
                        id="star1"
                        name="rating"
                        value="1"
                        className="hidden"
                      />
                      <label
                        htmlFor="star1"
                        className="cursor-pointer text-yellow-500"
                      >
                        ★
                      </label>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label
                      className="block lg:text-sm text-[10px] font-medium text-gray-700"
                      htmlFor="review"
                    >
                      Nhận xét:
                    </label>
                    <textarea
                      id="review"
                      rows={4}
                      className="px-2 py-2 placeholder:lg:text-sm text-[10px] mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Nhập nhận xét của bạn"
                    ></textarea>
                  </div>

                  <div className="mb-4">
                    <label
                      className="block lg:text-sm text-[10px] font-medium text-gray-700"
                      htmlFor="image"
                    >
                      Tải hình ảnh lên:
                    </label>
                    <input
                      id="image"
                      type="file"
                      accept="image/*"
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border file:border-gray-300 file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                    />
                  </div>

                  <div className="text-center">
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent lg:text-base text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Gửi đánh giá
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
        <RelatedProducts />
      </div>
    </>
  );
};

export default ProductDetail;

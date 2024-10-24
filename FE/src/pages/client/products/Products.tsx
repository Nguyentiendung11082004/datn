import Less from "@/components/icons/detail/Less";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import HeartWhite from "@/components/icons/detail/HeartWhite";
import Eye from "@/components/icons/detail/Eye";
import CartDetail from "@/components/icons/detail/CartDetail";
import "rc-slider/assets/index.css";
import {
  colorTranslations,
  convertColorNameToClass,
} from "@/common/colors/colorUtils";
import instance from "@/configs/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import NoDatasIcon from "@/components/icons/products/NoDataIcon";
import { ResponseData } from "@/common/types/responseDataFilter";
import unorm from "unorm";
import { useWishlist } from "@/common/context/Wishlist/WishlistContext";
import HeartRed from "@/components/icons/detail/HeartRed";
import { Button, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useAuth } from "@/common/context/Auth/AuthContext";
import { useCart } from "@/common/context/Cart/CartContext";
import ModalBuyNow from "./_components/ModalBuyNow";

const Products = () => {
  const [growboxDropdownOpen, setGrowboxDropdownOpen] = useState(false);
  const [toepfeDropdownOpen, setToepfeDropdownOpen] = useState(false);
  const growboxRef = useRef<HTMLDivElement>(null);
  const toepfeRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [noProductsMessage, setNoProductsMessage] =
    useState<React.ReactNode>(null);
  const { handleAddToWishlist, isInWishlist } = useWishlist();

  const [allproducts, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string[]>([]);
  const [appliedBrands, setAppliedBrands] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [isSale, setIsSale] = useState<boolean>(false);
  const [selectedSortName, setSelectedSortName] = useState("");
  const [temporarySortName, setTemporarySortName] = useState("");
  const [selectedSort, setSelectedSort] = useState<{
    trend: boolean;
    sortDirection: string | null;
    sortPrice: string | null;
    sortAlphaOrder: string | null;
  }>({
    trend: false,
    sortDirection: null,
    sortPrice: null,
    sortAlphaOrder: null,
  });

  const { mutate } = useMutation({
    mutationFn: async (filters: any) => {
      const response = await instance.post("/product-shop", filters, {
        timeout: 5000,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["productsData"], data);
      if (data.products.length === 0) {
        setNoProductsMessage(
          <div className="flex flex-col items-center ">
            <NoDatasIcon />
            <span className="text-gray-500 text-lg">
              Không có sản phẩm nào!
            </span>
          </div>
        );
      } else {
        setNoProductsMessage(null);
      }
    },
    onError: (error) => {
      console.error("Có lỗi xảy ra:", error);
    },
  });

  const applyFilters = useCallback(() => {
    const filters = {
      search: searchTerm,
      categorys: selectedCategories,
      brands: selectedBrand,
      sizes: selectedSizes,
      colors: selectedColors,
      min_price: minPrice,
      max_price: maxPrice,
      sale: isSale,
      trend: selectedSort.trend,
      sortDirection: selectedSort.sortDirection,
      sortPrice: selectedSort.sortPrice,
      sortAlphaOrder: selectedSort.sortAlphaOrder,
    };
    mutate(filters);
    setAppliedBrands(selectedBrand);
    setSelectedSortName(temporarySortName);
    setGrowboxDropdownOpen(false);
    setToepfeDropdownOpen(false);
  }, [
    searchTerm,
    selectedCategories,
    selectedBrand,
    selectedSizes,
    selectedColors,
    minPrice,
    maxPrice,
    isSale,
    selectedSort,
    temporarySortName,
    mutate,
  ]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategories([]);
    setSelectedBrand([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setMinPrice("");
    setMaxPrice("");
    setIsSale(false);
    setSelectedSort({
      trend: false,
      sortDirection: null,
      sortPrice: null,
      sortAlphaOrder: null,
    });
    applyFilters();
    setAppliedBrands([]);
    setTemporarySortName("");
    setSelectedSortName("");
    setGrowboxDropdownOpen(false);
    setToepfeDropdownOpen(false);
  };

  const handleCheckboxChange = (name: string, value: any) => {
    console.log(`Checkbox changed: ${name} -> ${value}`);
    switch (name) {
      case "categories":
        setSelectedCategories((prev) => {
          const newCategories = prev.includes(value)
            ? prev.filter((id) => id !== value) // Bỏ chọn
            : [...prev, value]; // Chọn
          applyFilters(); // Gọi hàm lọc ngay sau khi cập nhật
          return newCategories;
        });
        break;
      case "brands":
        setSelectedBrand((prev) => {
          const newBrands = prev.includes(value)
            ? prev.filter((brand) => brand !== value)
            : [...prev, value];

          return newBrands;
        });
        break;
      case "sizes":
        setSelectedSizes((prev) => {
          const newSizes = prev.includes(value)
            ? prev.filter((size) => size !== value)
            : [...prev, value];
          applyFilters();
          return newSizes;
        });
        break;
      case "colors":
        setSelectedColors((prev) => {
          const newColors = prev.includes(value)
            ? prev.filter((color) => color !== value)
            : [...prev, value];
          applyFilters();
          return newColors;
        });
        break;
      case "sale":
        setIsSale((prev) => {
          const newSale = !prev; // Đảo giá trị của isSale
          applyFilters();
          return newSale;
        });
        break;
      default:
        break;
    }
  };
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    applyFilters();
  }, [selectedCategories, selectedSizes, selectedColors, isSale]);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    const trimmedValue = value.trimStart(); // Loại bỏ khoảng trắng đầu

    if (trimmedValue === "") {
      setSuggestions([]);
      setNoProductsMessage(null);
      queryClient.invalidateQueries({ queryKey: ["productsData"] });
    } else {
      const fetchSuggestions = async () => {
        const response = await instance.post("/product-shop", {
          search: trimmedValue, // Gửi giá trị đã loại bỏ khoảng trắng đầu
        });
        const suggestionsData = response.data.products.map(
          (item: any) => item.product.name
        );

        // Lọc gợi ý chỉ hiển thị những từ khóa bắt đầu bằng searchTerm (có phân biệt dấu)
        const filteredSuggestions = suggestionsData.filter(
          (suggestion: string) => {
            const normalizedSuggestion = unorm.nfkd(suggestion.toLowerCase()); // Chuẩn hóa gợi ý
            const normalizedValue = unorm.nfkd(trimmedValue.toLowerCase()); // Chuẩn hóa giá trị tìm kiếm
            return normalizedSuggestion.startsWith(normalizedValue); // So sánh
          }
        );

        setSuggestions(filteredSuggestions);
      };
      fetchSuggestions();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuggestions([]);
    applyFilters();
  };

  // data
  const { data: pro, isFetching } = useQuery<ResponseData>({
    queryKey: ["productsData"],
    queryFn: async () => {
      const response = await instance.post("/product-shop");
      return response.data;
    },
  });
  // console.log(pro);

  const toggleGrowboxDropdown = () => {
    setGrowboxDropdownOpen(!growboxDropdownOpen);
    setToepfeDropdownOpen(false);
  };
  const toggleToepfeDropdown = () => {
    setToepfeDropdownOpen(!toepfeDropdownOpen);
    setGrowboxDropdownOpen(false);
  };
  const handleClickOutside = (event: any) => {
    if (growboxRef.current && !growboxRef.current.contains(event.target)) {
      setGrowboxDropdownOpen(false);
    }
    if (toepfeRef.current && !toepfeRef.current.contains(event.target)) {
      setToepfeDropdownOpen(false);
    }
  };
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // const [visiable, setVisible] = useState(false);
  // const closeModal = () => {
  //   // setIdCart('');
  //   setVisible(false);
  // };
  const navigate = useNavigate();
  const { isLoading, addToCart } = useCart();
  const handleAddToCart = (idProduct: any, idProductVariant: any) => {
    addToCart(idProduct, idProductVariant)
  }
  const buyNow = (idPr: any, qty: number) => {
    navigate('/checkout', { state: { cartId: idPr } });
  }
  return (
    <>
      <div>
        <section className="w-full">
          <div className="hd-page-head">
            <div className="hd-header-banner bg-[url('https://demo-kalles-4-1.myshopify.com/cdn/shop/files/shop-banner.jpg?v=1651829187&width=3024')] bg-no-repeat bg-cover bg-center">
              <div className="hd-bg-banner overflow-hidden relative !text-center bg-black bg-opacity-55 lg:py-[50px] mb-0 py-[30px]">
                <div className="z-[100] relative hd-container text-white">
                  <h1 className="text-xl font-medium leading-5 mb-3">
                    Sản phẩm
                  </h1>
                  <p className=" text-sm flex justify-center items-center">
                    <span className="hover:text-[#F2F2F2]">Trang chủ</span>
                    <Less />
                    <span className="hover:text-[#F2F2F2]">Sản phẩm</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* search */}
        <div className="container">
          <header className="max-w-2xl mx-auto -mt-5 flex flex-col lg:-mt-7 lg:pb-10">
            <form
              className="relative w-full"
              method="post"
              onSubmit={handleSubmit}
            >
              <label htmlFor="search-input" className="text-neutral-500 ">
                <input
                  className="block w-full outline-0 border border-neutral-200 bg-white dark:bg-neutral-50 disabled:bg-neutral-200 dark:disabled:bg-neutral-50 focus:border-neutral-200 rounded-full font-normal  pl-14 py-5 pr-5 md:pl-16 shadow-lg dark:border"
                  id="search-input"
                  placeholder="Nhập từ khóa của bạn"
                  type="search"
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <button
                  className="ttnc-ButtonCircle flex items-center justify-center rounded-full !leading-none disabled:bg-opacity-70 bg-slate-900 hd-all-hoverblue-btn
        text-slate-50 absolute right-2.5 top-1/2 transform -translate-y-1/2  w-11 h-11 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-6000 dark:focus:ring-offset-0"
                  type="submit"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    className="size-6 text-white"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                </button>
                <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-2xl md:left-6">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></path>
                    <path
                      d="M22 22L20 20"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></path>
                  </svg>
                </span>
              </label>
              {suggestions.length > 0 && searchTerm && (
                <ul className="absolute z-10 mt-1 w-full bg-white text-black border border-neutral-200 rounded-md shadow-lg">
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setSearchTerm(suggestion); // Điền vào ô tìm kiếm
                        setSuggestions([]);
                      }}
                    >
                      {suggestion.toLowerCase()}
                    </li>
                  ))}
                </ul>
              )}
            </form>
          </header>
        </div>

        {/* main */}
        <div className="container lg:space-x-4 lg:mt-10  xl:-mb-3 -mb-14 mt-10 lg:-mb-[9px]">
          <div
            className={`lg:flex flex sm:flex flex-1 space-x-4 lg:ml-[385px] xl:ml-[365px] `}
          >
            <div ref={growboxRef} className="flex items-center space-x-2 ">
              <button
                className="flex items-center justify-center px-4 py-2 text-sm rounded-full border focus:outline-none select-none
                border-neutral-300 text-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500
                "
                type="button"
                data-headlessui-state=""
                id="headlessui-popover-button-:rc:"
                onClick={toggleGrowboxDropdown}
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 2V5"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-miterlimit="10"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                  <path
                    d="M16 2V5"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-miterlimit="10"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                  <path
                    d="M7 13H15"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-miterlimit="10"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                  <path
                    d="M7 17H12"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-miterlimit="10"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                  <path
                    d="M16 3.5C19.33 3.68 21 4.95 21 9.65V15.83C21 19.95 20 22.01 15 22.01H9C4 22.01 3 19.95 3 15.83V9.65C3 4.95 4.67 3.69 8 3.5H16Z"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-miterlimit="10"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                </svg>
                <span className="ml-2">Hãng</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                  data-slot="icon"
                  className="w-4 h-4 ml-3"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  ></path>
                </svg>
              </button>
              <div className="hd-show-brand font-medium px-2">
                {pro?.brands
                  ?.filter((brand) =>
                    appliedBrands.includes(brand.id.toString())
                  )
                  .map((brand) => (
                    <span key={brand.id} className="underline mr-2">
                      -{" "}
                      {brand.name.charAt(0).toUpperCase() +
                        brand.name.slice(1).toLowerCase()}
                    </span>
                  ))}
              </div>
              {growboxDropdownOpen && (
                <div
                  className="absolute z-40 max-w-sm px-4 mt-10 -left-4 sm:left-0 lg:left-[385px] xl:mt-[298px] xl:left-[494px] sm:px-0 lg:max-w-sm opacity-100 translate-y-0 w-[300px] sm:w-[350px]"
                  id="headlessui-popover-panel-:r26:"
                  tabIndex={-1}
                  data-headlessui-state="open"
                  data-open=""
                >
                  {/* brands  */}
                  <div className="overflow-hidden rounded-2xl shadow-xl bg-white border border-neutral-200">
                    <div className="relative flex flex-col px-5 py-6 space-y-5">
                      {pro?.brands?.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center text-sm sm:text-base"
                        >
                          <input
                            id={`brand-${item.id}`}
                            className="focus:ring-action-primary text-primary-500 rounded-full border-slate-400 hover:border-slate-700 bg-transparent dark:border-slate-700 dark:hover:border-slate-500 dark:checked:bg-primary-500 focus:ring-primary-500 w-6 h-6"
                            type="checkbox"
                            name={item.name}
                            value={item.id.toString()}
                            checked={selectedBrand.includes(item.id.toString())}
                            onChange={() =>
                              handleCheckboxChange("brands", item.id.toString())
                            }
                          />
                          <label
                            htmlFor={`brand-${item.id}`}
                            className="pl-2.5 sm:pl-3 block text-slate-900 select-none"
                          >
                            {item.name.charAt(0).toUpperCase() +
                              item.name.slice(1).toLowerCase() || "No Brand"}
                          </label>
                        </div>
                      ))}
                    </div>

                    <div className="p-5 bg-neutral-50 dark:border-t dark:border-neutral-200 flex items-center justify-between">
                      <button
                        onClick={handleClearFilters}
                        className="nc-Button relative h-auto inline-flex items-center justify-center rounded-full transition-colors text-sm sm:text-base font-medium px-4 py-2 sm:px-5  ttnc-ButtonThird text-neutral-700 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-6000 dark:focus:ring-offset-0"
                      >
                        Xóa
                      </button>
                      <button
                        onClick={applyFilters}
                        className="nc-Button relative h-auto inline-flex items-center justify-center rounded-full transition-colors text-sm sm:text-base font-medium px-4 py-2 sm:px-5  ttnc-ButtonPrimary disabled:bg-opacity-90 bg-slate-900 text-slate-50 shadow-xl hd-all-hoverblue-btn"
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div ref={toepfeRef} className="flex items-center space-x-3 ">
              <button
                className="flex items-center justify-center px-4 py-2 text-sm border rounded-full focus:outline-none select-none           
                border-neutral-300 text-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500
                "
                type="button"
                aria-expanded="false"
                data-headlessui-state=""
                id="headlessui-popover-button-:rl:"
                onClick={toggleToepfeDropdown}
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M11.5166 5.70834L14.0499 8.24168"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-miterlimit="10"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                  <path
                    d="M11.5166 14.2917V5.70834"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-miterlimit="10"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                  <path
                    d="M8.48327 14.2917L5.94995 11.7583"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-miterlimit="10"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                  <path
                    d="M8.48315 5.70834V14.2917"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-miterlimit="10"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                  <path
                    d="M10.0001 18.3333C14.6025 18.3333 18.3334 14.6024 18.3334 10C18.3334 5.39763 14.6025 1.66667 10.0001 1.66667C5.39771 1.66667 1.66675 5.39763 1.66675 10C1.66675 14.6024 5.39771 18.3333 10.0001 18.3333Z"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                </svg>
                <span className="ml-2">Thứ tự</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                  data-slot="icon"
                  className="w-4 h-4 ml-3"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  ></path>
                </svg>
              </button>
              <div className="hd-show-sort font-medium underline">
                {selectedSortName}
              </div>
              {toepfeDropdownOpen && (
                <div
                  className="absolute z-40 max-w-sm px-4 mt-10 left-[120px] sm:left-[134px] lg:left-[520px] xl:mt-[430px] xl:left-[648px] sm:px-0 lg:max-w-sm opacity-100 translate-y-0 w-[300px] sm:w-[350px]"
                  id="headlessui-popover-panel-:r26:"
                  tabIndex={-1}
                  data-headlessui-state="open"
                  data-open=""
                >
                  {/* thứ tự */}
                  <div className="overflow-hidden rounded-2xl shadow-xl bg-white border border-neutral-200">
                    <div className="relative flex flex-col px-5 py-6 space-y-5">
                      <div className="flex items-center text-sm sm:text-base ">
                        <input
                          id="Most-Popular"
                          className="focus:ring-action-primary text-primary-500 rounded-full border-slate-400 hover:border-slate-700 bg-transparent dark:border-slate-700 dark:hover:border-slate-500 dark:checked:bg-primary-500 focus:ring-primary-500 w-6 h-6"
                          type="radio"
                          value="Phổ biến nhất"
                          name="radioNameSort"
                          checked={selectedSort.trend}
                          onChange={() => {
                            setSelectedSort({
                              trend: true,
                              sortDirection: null,
                              sortPrice: null,
                              sortAlphaOrder: null,
                            });
                            setTemporarySortName("Phổ biến nhất");
                          }}
                        />
                        <label
                          htmlFor="Most-Popular"
                          className="pl-2.5 sm:pl-3 block text-slate-900 select-none"
                        >
                          Phổ biến nhất
                        </label>
                      </div>
                      <div className="flex items-center text-sm sm:text-base ">
                        <input
                          id="Newest"
                          className="focus:ring-action-primary text-primary-500 rounded-full border-slate-400 hover:border-slate-700 bg-transparent dark:border-slate-700 dark:hover:border-slate-500 dark:checked:bg-primary-500 focus:ring-primary-500 w-6 h-6"
                          type="radio"
                          value="desc"
                          name="radioNameSort"
                          checked={selectedSort.sortDirection === "desc"}
                          onChange={() => {
                            setSelectedSort({
                              trend: false,
                              sortDirection: "desc",
                              sortPrice: null,
                              sortAlphaOrder: null,
                            });
                            setTemporarySortName("Mới nhất");
                          }}
                        />
                        <label
                          htmlFor="Newest"
                          className="pl-2.5 sm:pl-3 block text-slate-900  select-none"
                        >
                          Mới nhất
                        </label>
                      </div>
                      <div className="flex items-center text-sm sm:text-base ">
                        <input
                          id="Price-low-hight"
                          className="focus:ring-action-primary text-primary-500 rounded-full border-slate-400 hover:border-slate-700 bg-transparent dark:border-slate-700 dark:hover:border-slate-500 dark:checked:bg-primary-500 focus:ring-primary-500 w-6 h-6"
                          type="radio"
                          value="asc"
                          name="radioNameSort"
                          checked={selectedSort.sortPrice === "asc"}
                          onChange={() => {
                            setSelectedSort({
                              trend: false,
                              sortDirection: null,
                              sortPrice: "asc",
                              sortAlphaOrder: null,
                            });
                            setTemporarySortName("Giá thấp - cao");
                          }}
                        />
                        <label
                          htmlFor="Price-low-hight"
                          className="pl-2.5 sm:pl-3 block text-slate-900  select-none"
                        >
                          Giá thấp - cao
                        </label>
                      </div>
                      <div className="flex items-center text-sm sm:text-base ">
                        <input
                          id="Price-hight-low"
                          className="focus:ring-action-primary text-primary-500 rounded-full border-slate-400 hover:border-slate-700 bg-transparent dark:border-slate-700 dark:hover:border-slate-500 dark:checked:bg-primary-500 focus:ring-primary-500 w-6 h-6"
                          type="radio"
                          value="desc"
                          name="radioNameSort"
                          checked={selectedSort.sortPrice === "desc"}
                          onChange={() => {
                            setSelectedSort({
                              trend: false,
                              sortDirection: null,
                              sortPrice: "desc",
                              sortAlphaOrder: null,
                            });
                            setTemporarySortName("Giá cao - thấp");
                          }}
                        />
                        <label
                          htmlFor="Price-hight-low"
                          className="pl-2.5 sm:pl-3 block text-slate-900  select-none"
                        >
                          Giá cao - thấp
                        </label>
                      </div>
                      <div className="flex items-center text-sm sm:text-base ">
                        <input
                          id="Price-hight-low"
                          className="focus:ring-action-primary text-primary-500 rounded-full border-slate-400 hover:border-slate-700 bg-transparent dark:border-slate-700 dark:hover:border-slate-500 dark:checked:bg-primary-500 focus:ring-primary-500 w-6 h-6"
                          type="radio"
                          value="asc"
                          name="radioNameSort"
                          checked={selectedSort.sortAlphaOrder === "asc"}
                          onChange={() => {
                            setSelectedSort({
                              trend: false,
                              sortDirection: null,
                              sortPrice: null,
                              sortAlphaOrder: "asc",
                            });
                            setTemporarySortName("Từ A-Z");
                          }}
                        />
                        <label
                          htmlFor="Price-hight-low"
                          className="pl-2.5 sm:pl-3 block text-slate-900  select-none"
                        >
                          Từ A-Z
                        </label>
                      </div>
                      <div className="flex items-center text-sm sm:text-base ">
                        <input
                          id="Price-hight-low"
                          className="focus:ring-action-primary text-primary-500 rounded-full border-slate-400 hover:border-slate-700 bg-transparent dark:border-slate-700 dark:hover:border-slate-500 dark:checked:bg-primary-500 focus:ring-primary-500 w-6 h-6"
                          type="radio"
                          value="desc"
                          name="radioNameSort"
                          checked={selectedSort.sortAlphaOrder === "desc"}
                          onChange={() => {
                            setSelectedSort({
                              trend: false,
                              sortDirection: null,
                              sortPrice: null,
                              sortAlphaOrder: "desc",
                            });
                            setTemporarySortName("Từ Z-A");
                          }}
                        />
                        <label
                          htmlFor="Price-hight-low"
                          className="pl-2.5 sm:pl-3 block text-slate-900  select-none"
                        >
                          Từ Z-A
                        </label>
                      </div>
                    </div>
                    <div className="p-5 bg-neutral-50 dark:border-t dark:border-neutral-200 flex items-center justify-between">
                      <button
                        onClick={handleClearFilters}
                        className="nc-Button relative h-auto inline-flex items-center justify-center rounded-full transition-colors text-sm sm:text-base font-medium px-4 py-2 sm:px-5  ttnc-ButtonThird text-neutral-700 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-6000 dark:focus:ring-offset-0"
                      >
                        Xóa
                      </button>
                      <button
                        onClick={applyFilters}
                        className="nc-Button relative h-auto inline-flex items-center justify-center rounded-full transition-colors text-sm sm:text-base font-medium px-4 py-2 sm:px-5  ttnc-ButtonPrimary disabled:bg-opacity-90 bg-slate-900 text-slate-50 shadow-xl hd-all-hoverblue-btn"
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="container py-12 flex flex-col lg:flex-row">
          <div className="lg:w-1/3 xl:w-1/4 pr-4 lg:-mt-1 mt-10">
            <div className="divide-y divide-slate-200">
              {/* categories */}
              <div className="relative flex flex-col pb-8 space-y-4">
                <h3 className="font-semibold mb-2.5 ">Danh mục</h3>
                {pro?.categories?.map((item) => (
                  <div className="" key={item.id}>
                    <div className="flex text-sm sm:text-base ">
                      <input
                        id={`cat-${item.id}`}
                        className="focus:ring-action-primary text-primary-500 rounded border-slate-400 hover:border-slate-700 bg-transparent dark:border-slate-700 dark:hover:border-slate-500 dark:checked:bg-primary-500 focus:ring-primary-500 w-5 h-5"
                        type="checkbox"
                        name={item.name}
                        value={item.id}
                        checked={selectedCategories.includes(
                          item.id.toString()
                        )}
                        onChange={() =>
                          handleCheckboxChange("categories", item.id.toString())
                        }
                      />
                      <label
                        htmlFor={`cat-${item.id}`}
                        className="pl-2.5 sm:pl-3.5 flex flex-col flex-1 justify-center select-none"
                      >
                        <span className="text-slate-900 text-sm font-normal">
                          {item.name || "No Category"}
                        </span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              {/* colors */}
              <div className="relative flex flex-col py-8 space-y-4">
                <h3 className="font-semibold mb-2.5">Màu sắc</h3>
                {pro?.attributes?.color?.map((item) => (
                  <div className="" key={item.id}>
                    <div className="flex text-sm sm:text-base ">
                      <input
                        id={`color-${item.id}`}
                        className="focus:ring-action-primary text-primary-500 rounded border-slate-400 hover:border-slate-700 bg-transparent dark:border-slate-700 dark:hover:border-slate-500 dark:checked:bg-primary-500 focus:ring-primary-500 w-5 h-5"
                        type="checkbox"
                        name={item.name}
                        value={
                          item.value.charAt(0).toUpperCase() +
                          item.value.slice(1).toLowerCase()
                        }
                        checked={selectedColors.includes(
                          item.value.charAt(0).toUpperCase() +
                          item.value.slice(1).toLowerCase()
                        )}
                        onChange={() =>
                          handleCheckboxChange(
                            "colors",
                            item.value.charAt(0).toUpperCase() +
                            item.value.slice(1).toLowerCase()
                          )
                        }
                      />
                      <label
                        htmlFor={`color-${item.id}`}
                        className="pl-2.5 sm:pl-3.5 flex flex-col flex-1 justify-center select-none"
                      >
                        <span className="text-slate-900 text-sm font-normal ">
                          {colorTranslations[
                            item.value.charAt(0).toUpperCase() +
                            item.value.slice(1).toLowerCase()
                          ] || "No Size"}
                          {/*Dịch sang TViet và Chữ cái đầu viết hoa */}
                        </span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {/* sizes */}
              <div className="relative flex flex-col py-8 space-y-4">
                <h3 className="font-semibold mb-2.5">Kích thước</h3>
                {pro?.attributes?.size
                  ?.sort((a, b) => {
                    const aValue = a.value.toLowerCase();
                    const bValue = b.value.toLowerCase();

                    // Kiểm tra xem aValue và bValue có phải là số hay không
                    const aNumeric = aValue.replace(/[^0-9]/g, ""); // Lấy phần số từ chuỗi
                    const bNumeric = bValue.replace(/[^0-9]/g, "");

                    const isANumber = !isNaN(Number(aNumeric)); // Kiểm tra aValue có phải là số
                    const isBNumber = !isNaN(Number(bNumeric));

                    // So sánh chữ cái trước số, và số trước kích thước có đơn vị
                    if (!isANumber && !isBNumber)
                      return aValue.localeCompare(bValue); // Cả hai là chữ => so sánh trực tiếp
                    if (isANumber && !isBNumber) return 1; // a là số, b là chữ => a ở sau
                    if (!isANumber && isBNumber) return -1; // a là chữ, b là số => a ở trước

                    // Nếu cả hai đều là số, so sánh trực tiếp
                    return Number(aNumeric) - Number(bNumeric); // Ép kiểu thành số để so sánh
                  })
                  .map((item) => (
                    <div className="" key={item.id}>
                      <div className="flex text-sm sm:text-base ">
                        <input
                          id={`size-${item.id}`}
                          className="focus:ring-action-primary text-primary-500 rounded border-slate-400 hover:border-slate-700 bg-transparent dark:border-slate-700 dark:hover:border-slate-500 dark:checked:bg-primary-500 focus:ring-primary-500 w-5 h-5"
                          type="checkbox"
                          name={item.name}
                          value={item.value}
                          checked={selectedSizes.includes(item.value)}
                          onChange={() =>
                            handleCheckboxChange("sizes", item.value)
                          }
                        />
                        <label
                          htmlFor={`size-${item.id}`}
                          className="pl-2.5 sm:pl-3.5 flex flex-col flex-1 justify-center select-none"
                        >
                          <span className="text-slate-900 text-sm font-normal ">
                            {item.value || "No Size"}
                          </span>
                        </label>
                      </div>
                    </div>
                  ))}
              </div>

              {/* prices */}
              <div className="relative flex flex-col py-8 space-y-5 pr-3">
                <div className="flex space-x-3">
                  <div>
                    <label
                      htmlFor="minPrice"
                      className="block text-sm font-medium text-neutral-700"
                    >
                      Giá nhỏ nhất
                    </label>
                    <div className="mt-1 relative rounded-md">
                      <span className="absolute inset-y-0 right-[15px] flex items-center pointer-events-none text-neutral-500 sm:text-sm">
                        đ
                      </span>
                      <input
                        id="minPrice"
                        className="block w-[115px] pl-3 py-[6px] text-xs lg:text-sm border border-neutral-300 rounded-full bg-transparent"
                        type="number"
                        value={minPrice}
                        min="0"
                        placeholder="0"
                        name="minPrice"
                        onChange={(e) =>
                          setMinPrice(
                            Math.max(0, Number(e.target.value)).toString()
                          )
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="maxPrice"
                      className="block text-sm font-medium text-neutral-700"
                    >
                      Giá lớn nhất
                    </label>
                    <div className="mt-1 relative rounded-md">
                      <span className="absolute inset-y-0 right-[15px] flex items-center pointer-events-none text-neutral-500 sm:text-sm">
                        đ
                      </span>
                      <input
                        id="maxPrice"
                        className="block w-[115px] pl-3 py-[6px] text-xs lg:text-sm border border-neutral-300 rounded-full bg-transparent"
                        type="number"
                        value={maxPrice}
                        min="0"
                        placeholder="100.000.000"
                        name="maxPrice"
                        onChange={(e) =>
                          setMaxPrice(
                            Math.max(0, Number(e.target.value)).toString()
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="mt-1">
                    <button className="" onClick={applyFilters}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="25px"
                        height="25px"
                        viewBox="0 0 24 24"
                        fill="none"
                        className=""
                      >
                        <path
                          d="M21 6H19M21 12H16M21 18H16M7 20V13.5612C7 13.3532 7 13.2492 6.97958 13.1497C6.96147 13.0615 6.93151 12.9761 6.89052 12.8958C6.84431 12.8054 6.77934 12.7242 6.64939 12.5617L3.35061 8.43826C3.22066 8.27583 3.15569 8.19461 3.10948 8.10417C3.06849 8.02393 3.03853 7.93852 3.02042 7.85026C3 7.75078 3 7.64677 3 7.43875V5.6C3 5.03995 3 4.75992 3.10899 4.54601C3.20487 4.35785 3.35785 4.20487 3.54601 4.10899C3.75992 4 4.03995 4 4.6 4H13.4C13.9601 4 14.2401 4 14.454 4.10899C14.6422 4.20487 14.7951 4.35785 14.891 4.54601C15 4.75992 15 5.03995 15 5.6V7.43875C15 7.64677 15 7.75078 14.9796 7.85026C14.9615 7.93852 14.9315 8.02393 14.8905 8.10417C14.8443 8.19461 14.7793 8.27583 14.6494 8.43826L11.3506 12.5617C11.2207 12.7242 11.1557 12.8054 11.1095 12.8958C11.0685 12.9761 11.0385 13.0615 11.0204 13.1497C11 13.2492 11 13.3532 11 13.5612V17L7 20Z"
                          stroke="#808080"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </button>
                    <button onClick={handleClearFilters}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="#A0A0A0"
                        className="size-6"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* product-sale  */}
              <div className="py-8 pr-2">
                <div className="MySwitch flex justify-between items-center space-x-2 ">
                  <div>
                    <label
                      className="nc-Label text-base font-medium text-neutral-900"
                      data-nc-id="Label"
                    >
                      Đang giảm giá!
                    </label>
                    <p className="text-neutral-500 dark:text-neutral-400  text-xs">
                      Sản phảm hiện đang được bán
                    </p>
                  </div>
                  <label className="hd-switch relative">
                    <input
                      className="relative w-[65px] h-[30px] bg-[#c6c6c6] rounded-[20px] checked:bg-[#00BADB] before:content-[''] before:absolute before:top-[2.5px] before:left-[2.5px] before:scale-[1.1] before:w-[25px] before:h-[25px] before:bg-white before:rounded-[20px] before:transition-all before:duration-500 checked:before:left-[38px] hd-ok"
                      type="checkbox"
                      checked={isSale}
                      onChange={() => handleCheckboxChange("sale", null)}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="border-l border-gray-200"></div>

          <div className="">
            {/* products */}
            {noProductsMessage && (
              <div className="flex bg-gray-50 h-full w-[1000px] justify-center pt-32">
                {noProductsMessage}
              </div>
            )}
            <div className="flex-1 ml-8">
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:mx-7 sm:gap-x-10 xl:gap-8 gap-y-8 ">
                {/* {isFetching ? (
                  Array(6).fill(0).map((_, index) => (
                    <div
                      key={index}
                      className="animate-pulse flex flex-col space-y-4 bg-gray-200 w-[290px] rounded-lg p-4"
                    >
                      <div className="bg-gray-300 h-[250px] w-full lg:h-[330px] lg:w-[260px] sm:h-[345px]"></div>
                      <div className="bg-gray-300 h-6 w-3/4"></div>
                      <div className="bg-gray-300 h-6 w-1/2"></div>
                    </div>
                  ))
                ) : ( */}
                {pro?.products?.map(({ product, getUniqueAttributes }) => {
                  const inWishlist = isInWishlist(product.id);

                  return (
                    <div
                      className="nc-ProductCard relative flex flex-col bg-transparent"
                      key={product.id}
                    >
                      <div className="lg:mb-[25px] mb-[20px]">
                        <div className="cursor-pointer lg:mb-[15px] mb-[10px] group group/image relative h-[250px] w-full lg:h-[345px] lg:w-[290px] sm:h-[345px] overflow-hidden">
                          <img
                            className="group-hover/image:scale-125 absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out opacity-100 group-hover/image:opacity-0 object-cover "
                            src={product.img_thumbnail}
                          />
                          <img
                            className="group-hover/image:scale-125 absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out opacity-0 group-hover/image:opacity-100 object-cover"
                            src={product.img_thumbnail}
                          />
                          <div className="absolute inset-0 bg-black opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-10"></div>
                          <div>
                            <button
                              className="absolute left-5 top-5 cursor-pointer"
                              onClick={() => handleAddToWishlist(product)}
                            >
                              {inWishlist ? <HeartRed /> : <HeartWhite />}
                            </button>
                          </div>
                          <div className="mb-[15px] absolute top-[50%] flex flex-col justify-between left-[50%] -translate-x-1/2 -translate-y-1/2 h-[40px] transform transition-all duration-500 ease-in-out group-hover:-translate-y-1/2 opacity-0 group-hover:opacity-100">
                            <div className="group/btn relative">
                              {
                                product.variants.length > 0 ? (
                                  <button className="lg:h-[40px] lg:w-[136px] lg:rounded-full bg-[#fff] text-base text-[#000] lg:hover:bg-[#000]">
                                    <p className="text-sm lg:block hidden translate-y-2 transform transition-all duration-300 ease-in-out group-hover/btn:-translate-y-2 group-hover/btn:opacity-0">
                                      Mua ngay
                                    </p>
                                    <Eye />
                                  </button>
                                ) : (
                                  <button onClick={() => buyNow(product?.id, 1)} className="lg:h-[40px] lg:w-[136px] lg:rounded-full bg-[#fff] text-base text-[#000] lg:hover:bg-[#000]">
                                    <p className="text-sm lg:block hidden translate-y-2 transform transition-all duration-300 ease-in-out group-hover/btn:-translate-y-2 group-hover/btn:opacity-0">
                                      Mua ngay
                                    </p>
                                    <Eye />
                                  </button>
                                )
                              }
                            </div>
                           


                            <Link to="" className="group/btn relative">
                              <button onClick={() => handleAddToCart(product?.id, product?.variants[0]?.id)} className="mt-2 h-[40px] w-[136px] rounded-full bg-[#fff] text-base text-[#000] hover:bg-[#000]">
                                <p className="text-sm block translate-y-2 transform transition-all duration-300 ease-in-out group-hover/btn:-translate-y-2 group-hover/btn:opacity-0">
                                  Thêm vào giỏ hàng
                                </p>
                                {
                                  isLoading ? <Spin indicator={<LoadingOutlined style={{ fontSize: 28, color: '#fff' }} />} className="translate-y-[-12px]" /> : <CartDetail />
                                }
                              </button>
                            </Link>
                          </div>
                          <div className="flex justify-center">
                            <div
                              className="absolute bottom-2 text-center text-white
              -translate-y-7 transform 
                transition-all duration-500 ease-in-out 
                group-hover:translate-y-0
                opacity-0
                group-hover:opacity-100
              "
                            >
                              <ul className="flex">
                                {getUniqueAttributes &&
                                  Object.entries(getUniqueAttributes).map(([key, value]) => (
                                    <li key={key}>
                                      {/* {key}:  */}
                                      {Array.isArray(value)
                                        ? value.map((v) => v.size || v).join(", ") // Lấy thuộc tính 'size' hoặc hiển thị giá trị trực tiếp
                                        : typeof value === "object" && value !== null
                                          ? Object.values(value).join(", ") // Hiển thị các giá trị của object
                                          : String(value)}
                                    </li>
                                  ))}

                              </ul>
                            </div>
                          </div>

                          {product.price_regular && (
                            <div>
                              {product.price_sale > 0 &&
                                product.price_sale < product.price_regular ? (
                                <>
                                  <div className="flex justify-center items-center text-white absolute right-2 top-2 lg:h-[40px] lg:w-[40px] h-[30px] w-[30px] lg:text-sm text-[12px] rounded-full bg-red-400">
                                    -
                                    {Math.round(
                                      ((product.price_regular -
                                        product.price_sale) /
                                        product.price_regular) *
                                      100
                                    )}
                                    %
                                  </div>
                                </>
                              ) : (
                                <div></div>
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-base font-medium text-black mb-1 cursor-pointer hd-all-hover-bluelight">
                            {product.name.charAt(0).toUpperCase() +
                              product.name.slice(1).toLowerCase()}
                          </p>
                          {(product?.price_regular ||
                            product?.variants?.length) && (
                              <div>
                                {(() => {
                                  const variants = product?.variants || [];
                                  // Tính toán giá bán và giá gốc từ các biến thể
                                  const minPriceSale = Math.min(
                                    ...variants
                                      .map((variant: any) => variant.price_sale)
                                      .filter((price: any) => price >= 0)
                                  );
                                  const minPriceRegular = Math.min(
                                    ...variants
                                      .map(
                                        (variant: any) => variant.price_regular
                                      )
                                      .filter((price: any) => price >= 0)
                                  );
                                  const maxPriceRegular = Math.max(
                                    ...variants
                                      .map(
                                        (variant: any) => variant.price_regular
                                      )
                                      .filter((price: any) => price > 0)
                                  );
                                  const productPriceSale = product?.price_sale;
                                  const productPriceRegular =
                                    product?.price_regular;

                                  // Điều kiện hiển thị
                                  if (minPriceSale >= 0) {
                                    // Nếu có giá sale
                                    if (
                                      productPriceSale &&
                                      productPriceSale < productPriceRegular
                                    ) {
                                      return (
                                        <>
                                          <del className="mr-1">
                                            {new Intl.NumberFormat(
                                              "vi-VN"
                                            ).format(productPriceRegular)}
                                            ₫
                                          </del>
                                          <span className="text-[red]">
                                            {new Intl.NumberFormat(
                                              "vi-VN"
                                            ).format(productPriceSale)}
                                            ₫
                                          </span>
                                        </>
                                      );
                                    } else if (
                                      productPriceSale &&
                                      productPriceSale === productPriceRegular
                                    ) {
                                      return (
                                        <span>
                                          {new Intl.NumberFormat("vi-VN").format(
                                            productPriceRegular
                                          )}
                                          ₫
                                        </span>
                                      );
                                    } else {
                                      return (
                                        <span>
                                          {new Intl.NumberFormat("vi-VN").format(
                                            minPriceSale
                                          )}
                                          ₫ -{" "}
                                          {new Intl.NumberFormat("vi-VN").format(
                                            maxPriceRegular
                                          )}
                                          ₫
                                        </span>
                                      );
                                    }
                                  } else {
                                    // Nếu không có giá sale, chỉ hiển thị khoảng giá regular
                                    return (
                                      <span>
                                        {new Intl.NumberFormat("vi-VN").format(
                                          minPriceRegular
                                        )}
                                        ₫ -{" "}
                                        {new Intl.NumberFormat("vi-VN").format(
                                          maxPriceRegular
                                        )}
                                        ₫
                                      </span>
                                    );
                                  }
                                })()}
                              </div>
                            )}
                        </div>

                        <div className="t4s-product-colors flex">
                          {getUniqueAttributes?.color &&
                            Object.values(getUniqueAttributes.color)
                              .filter((color) => typeof color === "string")
                              .map((color, index) => (
                                <div key={index} className="mr-2 mt-1">
                                  <span className="t4s-pr-color__item flex flex-col items-center cursor-pointer">
                                    <span className="t4s-pr-color__value border border-gray-400 w-5 h-5 hover:border-black hover:border-2 rounded-full p-[5px]">
                                      <div
                                        className={` w-[17px] h-[17px] rounded-full ml-[-4.25px] mt-[-4px] hover:mt-[-5px] hover:ml-[-5px] ${convertColorNameToClass(color)}`}
                                      ></div>
                                    </span>
                                  </span>
                                </div>
                              ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* )} */}
              </div>
            </div>

            {/* end-products */}
          </div>
        </div>
      </div>
    </>
  );
};

export default Products;
import Loading from "@/common/Loading/Loading";
import OrderLookup from "@/components/website/OrderLookup";
import FastDelivery from "@/pages/admin/fastDelivery/FastDelivery";
import ReturnOrder from "@/pages/admin/order/components/ReturnOrder";
import ReturnOrderId from "@/pages/admin/order/components/ReturnOrderId";
import CheckAdmin from "@/pages/client/auth/permission/CheckAdmin";
import RequestOrder from "@/pages/client/requestOrder/RequestOrder";
import GetReturnRequestOrderId from "@/pages/client/returnRequest/GetReturnRequestOrderId";
import ReturnRequest from "@/pages/client/returnRequest/ReturnRequest";
import React, { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";

const Vouchers = lazy(() => import("@/pages/admin/vouchers/Vouchers"));
const VoucherDetail = lazy(
  () => import("@/pages/admin/vouchers/components/VoucherDetail")
);
const FormVoucher = lazy(
  () => import("@/pages/admin/vouchers/components/FormVoucher")
);
const OrderDetail = lazy(
  () => import("@/pages/admin/order/components/OrderDetail")
);
const ProductForm = lazy(
  () => import("@/pages/admin/products/_components/ProductForm")
);

const HomePage = lazy(() => import("../pages/client/home/HomePage"));
const Wishlist = lazy(() => import("@/pages/client/wishlist/Wishlist"));
const Products = lazy(() => import("@/pages/client/products/Products"));
const ProductDetail = lazy(
  () => import("@/pages/client/productDetail/ProductDetail")
);
const About = lazy(() => import("@/pages/client/about/About"));
const Account = lazy(() => import("@/pages/client/account/Account"));
const Cart = lazy(() => import("@/pages/client/cart/Cart"));
const Checkout = lazy(() => import("@/pages/client/checkout/Checkout"));
const Contact = lazy(() => import("@/pages/client/contact/Contact"));
const HistoryOrder = lazy(
  () => import("@/pages/client/historyOrder/HistoryOrder")
);
const NotFound = lazy(() => import("@/pages/client/notfound/NotFound"));
const Login = lazy(() => import("@/pages/client/auth/login/Login"));
const Register = lazy(() => import("@/pages/client/auth/register/Register"));
const ForgotPassword = lazy(
  () => import("@/pages/client/auth/forgotpassword/ForgotPassword")
);
const ResetPassword = lazy(
  () => import("@/pages/client/auth/resetpassword/ResetPassword")
);
const PasswordResetHandler = lazy(
  () => import("@/pages/client/auth/resetpassword/PasswordResetHandler")
);
const Thanks = lazy(() => import("@/pages/client/thanks/Thanks"));
const Order = lazy(() => import("@/pages/client/order"));
const Permission = lazy(() => import("@/pages/client/auth/permission"));
const LayoutWebsite = lazy(() => import("../pages/client/layout"));
const LayoutAdmin = lazy(() => import("@/pages/admin/layout"));
const Dashboard = lazy(() => import("@/pages/admin/dashboard/Dashboard"));
const ProductPageManager = lazy(() => import("@/pages/admin/products/page"));
const ProductDetailAdmin = lazy(
  () => import("@/pages/admin/products/_components/ProductDetail")
);
// const ProductForm = lazy(
//   () => import("@/pages/admin/products/_components/ProductForm")
// );
const CategoryPage = lazy(() => import("@/pages/admin/category/Category"));
const CategoryForm = lazy(
  () => import("@/pages/admin/category/_components/CategoryForm")
);
const AttributeItem = lazy(
  () => import("@/pages/admin/attribute/attribute-item/page")
);
const AttributeItemValues = lazy(
  () => import("@/pages/admin/attribute/attribute-item-values/page")
);
const ClientPage = lazy(() => import("@/pages/admin/account/client/Client"));
const FormClient = lazy(
  () => import("@/pages/admin/account/client/components/FormClient")
);
const EmployeePage = lazy(
  () => import("@/pages/admin/account/employee/Employee")
);
const FormEmployee = lazy(
  () => import("@/pages/admin/account/employee/components/FormEmployee")
);
const Brands = lazy(() => import("@/pages/admin/brands/Brands"));
const BrandForm = lazy(
  () => import("@/pages/admin/brands/_components/BrandForm")
);
const OrderPage = lazy(() => import("@/pages/admin/order/Order"));
const Tags = lazy(() => import("@/pages/admin/tags/Tags"));
const FormTag = lazy(() => import("@/pages/admin/tags/_components/TagForm"));
const Banners = lazy(() => import("@/pages/admin/banners/Banners"));
const BannersForm = lazy(
  () => import("@/pages/admin/banners/components/BannersForm")
);
const Posts = lazy(() => import("@/pages/admin/posts/Posts"));
const FormPost = lazy(() => import("@/pages/admin/posts/components/FormPost"));
const Chatbox = lazy(() => import("@/pages/admin/chatbox/Chatbox"));
const CommentPage = lazy(() => import("@/pages/admin/comments/Comments"));

const Router = () => {
  return (
    <Suspense
      fallback={
        <div>
          <Loading />
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<LayoutWebsite />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<Products />} />
          {/* <Route path="products/:id" element={<ProductDetail />} /> */}
          <Route path="products/:slug.html" element={<ProductDetail />} />

          <Route path="about" element={<About />} />
          <Route path="" element={<Permission />}>
            <Route path="cart" element={<Cart />} />
            <Route path="account" element={<Account />} />
            <Route path="wishlist" element={<Wishlist />} />
          </Route>
          <Route path="checkout" element={<Checkout />} />
          <Route path="contact" element={<Contact />} />
          <Route path="thank" element={<Thanks />} />
          <Route path="history-order" element={<HistoryOrder />} />
          <Route path="requestOrder" element={<RequestOrder />} />
          <Route path="return/request_order" element={<ReturnRequest />} />
          <Route
            path="/history-order/return_requests"
            element={<GetReturnRequestOrderId />}
          />
          <Route path="/order" element={<Order />} />
          <Route path="/order_lookup" element={<OrderLookup />} />
        </Route>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="account/forgotpassword" element={<ForgotPassword />} />
        <Route
          path="/password/reset/:token"
          element={<PasswordResetHandler />}
        />
        <Route path="password/reset" element={<ResetPassword />} />
        <Route path="" element={<CheckAdmin />}>
          <Route path="/admin" element={<LayoutAdmin />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<ProductPageManager />} />
            <Route path="products/:id" element={<ProductDetailAdmin />} />
            <Route path="products/create" element={<ProductForm />} />
            <Route path="products/edit/:id" element={<ProductForm />} />
            <Route path="categories" element={<CategoryPage />} />
            <Route path="categories/create" element={<CategoryForm />} />
            <Route path="categories/edit/:id" element={<CategoryForm />} />
            <Route path="attributes" element={<AttributeItem />} />
            <Route path="attribute-values" element={<AttributeItemValues />} />
            <Route path="clients" element={<ClientPage />} />
            <Route path="clients/create" element={<FormClient />} />
            <Route path="employees" element={<EmployeePage />} />
            <Route path="employees/create" element={<FormEmployee />} />
            <Route path="employees/edit/:id" element={<FormEmployee />} />
            <Route path="brands" element={<Brands />} />
            <Route path="brands/create" element={<BrandForm />} />
            <Route path="brands/edit/:id" element={<BrandForm />} />
            <Route path="tags" element={<Tags />} />
            <Route path="tags/create" element={<FormTag />} />
            <Route path="tags/edit/:id" element={<FormTag />} />
            <Route path="banners" element={<Banners />} />
            <Route path="banners/create" element={<BannersForm />} />
            <Route path="banners/edit/:id" element={<BannersForm />} />
            <Route path="posts" element={<Posts />} />
            <Route path="posts/create" element={<FormPost />} />
            <Route path="posts/edit/:id" element={<FormPost />} />
            <Route path="chatbox" element={<Chatbox />} />
            <Route path="vouchers" element={<Vouchers />} />
            <Route path="vouchers/:id" element={<VoucherDetail />} />
            <Route path="vouchers/create" element={<FormVoucher />} />
            <Route path="vouchers/edit/:id" element={<FormVoucher />} />
            <Route path="comments" element={<CommentPage />} />
            <Route path="orders" element={<OrderPage />} />
            <Route path="returnRequests" element={<ReturnOrder />} />
            <Route path="return-item/:id" element={<ReturnOrderId />} />

            <Route path="fastDelivery" element={<FastDelivery />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            {/* <Route path="/comments" element={<CommentPage/>} /> */}
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default Router;

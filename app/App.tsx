import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { SignInPage, SignUpPage } from "../merchant/AuthPages";
import { OnboardingPage } from "../merchant/Onboarding";
import { MerchantLayout } from "../merchant/Layout";
import { RequireAuth } from "../merchant/context";
import { OverviewPage } from "../merchant/Overview";
import { ProductsPage } from "../merchant/Products";
import { ProductEditorPage } from "../merchant/ProductEditor";
import { OrdersPage } from "../merchant/Orders";
import { SharePage, SocialHubPage } from "../merchant/Share";
import { WhatsAppPage } from "../merchant/WhatsApp";
import { CustomersPage, SettingsPage, StorefrontSettingsPage } from "../merchant/Settings";
import { LandingPage } from "../storefront/Landing";
import { ShopPage } from "../storefront/Shop";
import { ProductPage } from "../storefront/Product";
import { CartPage, CheckoutPage, OrderResultPage } from "../storefront/Checkout";

function LegacyShopRedirect() {
  const { shopSlug, productSlug } = useParams();
  if (productSlug) return <Navigate to={`/shop/${shopSlug}/${productSlug}`} replace />;
  return <Navigate to={`/shop/${shopSlug}`} replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />
      <Route path="/setup" element={<Navigate to="/onboarding" replace />} />

      <Route path="/s/:shopSlug" element={<LegacyShopRedirect />} />
      <Route path="/s/:shopSlug/p/:productSlug" element={<LegacyShopRedirect />} />

      <Route path="/shop/:shopSlug" element={<ShopPage />} />
      <Route path="/shop/:shopSlug/cart" element={<CartPage />} />
      <Route path="/shop/:shopSlug/checkout" element={<CheckoutPage />} />
      <Route path="/shop/:shopSlug/:itemSlug" element={<ProductPage />} />
      <Route path="/order/:reference" element={<OrderResultPage />} />

      <Route path="/dashboard" element={<RequireAuth><MerchantLayout /></RequireAuth>}>
        <Route index element={<OverviewPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductEditorPage />} />
        <Route path="products/:productId" element={<ProductEditorPage />} />
        <Route path="products/:productId/share" element={<SharePage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="storefront" element={<StorefrontSettingsPage />} />
        <Route path="social" element={<SocialHubPage />} />
        <Route path="whatsapp" element={<WhatsAppPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

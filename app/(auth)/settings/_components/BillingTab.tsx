"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePricingTable, useCustomer, CheckoutDialog } from "autumn-js/react";
import React from "react";

const FREE_CONTEXT_LIMIT = 2;
const PRO_CONTEXT_LIMIT = 10;

const BillingTab = () => {
  const { products } = usePricingTable();
  const { customer, checkout } = useCustomer();

  const activeProduct = customer?.products.find((p) => p.status === "active");

  const handleCheckout = async (productId: string) => {
    console.log(productId);
    if (productId === activeProduct?.id) return;
    await checkout({
      productId,
      dialog: CheckoutDialog,
    });
  };

  return (
    <div className="w-full">
      <div className="flex gap-3 w-full">
        {products?.map((product) => {
          const scanItems = product.items.find(
            (item) => item.feature_id === "scans",
          );
          const documentationLimit = product.items.find(
            (item) => item.feature_id === "documentation_limit",
          );
          const isSelected = activeProduct?.id === product.id;
          const isFree = product.properties.is_free;
          return (
            <Card className="flex-1 w-full p-3 gap-1" key={product.id}>
              <p className="text-lg">{product.name}</p>
              <p className="text-xl font-semibold">
                {product.properties.is_free
                  ? "Free"
                  : "$" + product.items[0].price}
              </p>
              <div className="space-y-2 py-2 border-t-3 my-2">
                <div className="flex justify-between items-center w-full">
                  <p>Total Scans </p>
                  <p>{scanItems?.included_usage} scans</p>
                </div>
                <div className="flex justify-between items-center w-full">
                  <p>Multi Documentation Context</p>
                  <p>
                    {documentationLimit
                      ? PRO_CONTEXT_LIMIT
                      : FREE_CONTEXT_LIMIT}{" "}
                    Context
                  </p>
                </div>
              </div>
              {
                <Button
                  disabled={isSelected}
                  variant={isSelected ? "outline" : "default"}
                  onClick={() => handleCheckout(product.id)}
                >
                  {isSelected ? "Selected" : isFree ? "Downgrade" : "Upgrade"}
                </Button>
              }
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BillingTab;

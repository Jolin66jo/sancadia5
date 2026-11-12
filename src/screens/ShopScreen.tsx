import { Sparkles, Store } from 'lucide-react';
import ScreenHeader from '@/components/ScreenHeader';
import Card from '@/components/Card';
import { usePublishedContent } from '@/hooks/usePublishedContent';
import useTranslation from '@/hooks/useTranslation';

const shopContentTypes = ['cosmetic_collection', 'premium_product'] as const;

export default function ShopScreen() {
  const { tText } = useTranslation();
  const { content, loading, error } = usePublishedContent(shopContentTypes);
  const collections = content.filter((item) => item.content_type === 'cosmetic_collection');
  const products = content.filter((item) => item.content_type === 'premium_product');

  return (
    <>
      <ScreenHeader title={tText('Shop')} backTo="/" />
      <div className="grid gap-4 pb-4">
        {error && (
          <Card role="alert" className="text-sm">
            {error}
          </Card>
        )}
        {loading && (
          <p role="status" className="text-sm text-subtle">
            {tText('Loading shop content…')}
          </p>
        )}
        <Card className="grid gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Store className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold">{tText('Marketplace')}</h2>
              <p className="text-sm text-subtle">
                {tText('Avatar cosmetics, power-ups, and daily deals.')}
              </p>
            </div>
          </div>
          {collections.length === 0 ? (
            <p className="text-sm text-subtle">
              {tText('No cosmetic collections are currently available.')}
            </p>
          ) : (
            <div className="grid gap-3">
              {collections.map((collection) => (
                <article key={collection.id} className="border-t border-border pt-3">
                  <h3 className="font-bold">{collection.title}</h3>
                  {collection.description && (
                    <p className="mt-1 text-sm text-subtle">{collection.description}</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </Card>
        <Card className="grid gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Sparkles className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold">{tText('Battle Pass')}</h2>
              <p className="text-sm text-subtle">{tText('Seasonal rewards and unlocks.')}</p>
            </div>
          </div>
          {products.length === 0 ? (
            <p className="text-sm text-subtle">
              {tText('No premium products are currently available.')}
            </p>
          ) : (
            <div className="grid gap-3">
              {products.map((product) => (
                <article key={product.id} className="border-t border-border pt-3">
                  <h3 className="font-bold">{product.title}</h3>
                  {product.description && (
                    <p className="mt-1 text-sm text-subtle">{product.description}</p>
                  )}
                  {typeof product.payload.price_label === 'string' && (
                    <p className="mt-1 text-sm font-semibold">{product.payload.price_label}</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

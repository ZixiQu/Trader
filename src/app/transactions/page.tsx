'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function TransactionsPage() {
    const [transactions, setTransactions] = React.useState<any[]>([]);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const limit = 10;

    const loadPage = async (p: number) => {
        const res = await fetch(`/api/transaction?page=${p}&limit=${limit}`);
        const json = await res.json();

        setTransactions(json.transactions);
        setTotalPages(json.totalPages);
        setPage(json.page);
    };

    React.useEffect(() => {
        loadPage(1);
    }, []);

    return (
        <div className="p-4 w-full max-w-5xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold">Transaction History</h1>

            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Your Transactions</CardTitle>
                </CardHeader>

                <CardContent>
                    <ScrollArea className="w-full rounded-md border">
                        <div className="p-4 space-y-3 min-w-[700px]">
                            {/* Header row */}
                            <div className="grid grid-cols-6 text-xs font-semibold text-muted-foreground pb-2 border-b">
                                <div>Type</div>
                                <div>Asset</div>
                                <div>Symbol</div>
                                <div className="text-right">Units</div>
                                <div className="text-right">Total (Price × Units)</div>
                                <div className="text-right">Timestamp</div>
                            </div>

                            {transactions.map(t => {
                                const quantity = Number(t.quantity || 0);
                                const price = Number(t.price || 0);
                                const total = quantity * price;

                                return (
                                    <React.Fragment key={t.id}>
                                        <div className="grid grid-cols-6 text-sm items-center py-1">
                                            {/* Type */}
                                            <div className="font-semibold">{t.type}</div>

                                            {/* Asset */}
                                            <div className="text-muted-foreground">{t.assetType}</div>

                                            {/* Symbol */}
                                            <div>{t.symbol}</div>

                                            {/* Units */}
                                            <div className="text-right">{quantity.toFixed(4)}</div>

                                            {/* Total value */}
                                            <div className="text-right">{total.toFixed(4)}</div>

                                            {/* Timestamp */}
                                            <div className="text-right">{new Date(t.createdAt).toLocaleString()}</div>
                                        </div>
                                        <Separator />
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </ScrollArea>

                    {/* Pagination Controls */}
                    <div className="flex justify-between items-center mt-4">
                        <Button disabled={page === 1} onClick={() => loadPage(page - 1)} variant="outline">
                            Previous
                        </Button>

                        <span className="text-sm text-muted-foreground">
                            Page {page} of {totalPages}
                        </span>

                        <Button disabled={page === totalPages} onClick={() => loadPage(page + 1)}>
                            Next
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

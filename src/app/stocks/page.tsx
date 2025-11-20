'use client';

import { useState, useMemo } from 'react';
import { STOCKS, StockSymbol } from '@/constants/assets';
import { useStockData } from '@/hooks/useStockData';
import { mergeStockData } from '@/utils/mergeStockData';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartConfig } from '@/components/ui/chart';
import { LineChart, Line, XAxis, CartesianGrid, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { RANGE_OPTIONS } from '@/constants/time';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Holdings } from '@/components/holdings';
import { useRouter } from 'next/navigation';

const chartConfig = {
	price: { label: 'Price' },
} satisfies ChartConfig;

export default function StocksPage() {
	const [activeStock, setActiveStock] = useState<StockSymbol | 'ALL'>('ALL');
	const [range, setRange] = useState<'1d' | '1mo' | '3mo'>('1d');
	const router = useRouter();
	const rawData = useStockData(activeStock, range);

	const combinedData = useMemo(() => mergeStockData(rawData), [rawData]);

	const activeSymbols = activeStock === 'ALL' ? STOCKS : [activeStock];

	return (
		<div className="w-full flex flex-row">
			<div className="w-2/3 px-3">
				<Card className="py-4 sm:py-0 w-full">
					<CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
						<div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
							<Select
								value={activeStock}
								onValueChange={(v) => setActiveStock(v as any)}
							>
								<SelectTrigger className="h-auto px-0 py-0 border-none shadow-none focus:ring-0 focus:ring-offset-0">
									<CardTitle className="cursor-pointer">
										<SelectValue
											placeholder="Select Stock"
											defaultValue={activeStock}
										/>
									</CardTitle>
								</SelectTrigger>

								<SelectContent>
									<SelectItem value="ALL">All Stocks</SelectItem>
									{STOCKS.map((s) => (
										<SelectItem key={s} value={s}>
											{s}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* <div className="flex">
                        {Object.entries(RANGE_OPTIONS).map(([key, meta]) => (
                            <button key={key} data-active={range === key} onClick={() => setRange(key as any)} className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6">
                                <span className="text-muted-foreground text-xs">{meta.label}</span>
                            </button>
                        ))}
                    </div> */}
						<div className="flex items-center px-6 sm:px-8 py-4 border-t sm:border-t-0 sm:border-l">
							<Select value={range} onValueChange={(v) => setRange(v as any)}>
								<SelectTrigger className="w-[140px]">
									<SelectValue placeholder="Range" />
								</SelectTrigger>

								<SelectContent>
									{Object.entries(RANGE_OPTIONS).map(([key, meta]) => (
										<SelectItem key={key} value={key}>
											{meta.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</CardHeader>

					<CardContent className="px-2 sm:p-6 space-y-4">
						<ChartContainer config={chartConfig} className="">
							<LineChart
								data={combinedData}
								width={undefined}
								margin={{ left: 12, right: 12 }}
							>
								<CartesianGrid vertical={false} />

								<XAxis
									dataKey="date"
									tickMargin={8}
									minTickGap={32}
									allowDuplicatedCategory={false}
									tickFormatter={(value) => {
										const d = new Date(value);
										if (range === '1d') {
											return d.toLocaleTimeString('en-US', {
												hour: '2-digit',
												minute: '2-digit',
											});
										}
										return d.toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric',
										});
									}}
								/>

								{activeSymbols.map((symbol) => (
									<YAxis
										key={symbol}
										yAxisId={symbol}
										domain={['dataMin', 'dataMax']}
										hide
									/>
								))}

								{/* Tooltip */}
								<ChartTooltip
									content={({ label, payload }) => {
										if (!payload || payload.length === 0) return null;

										return (
											<div className="rounded-md border bg-popover p-3 text-sm shadow-md">
												<div className="mb-2 font-medium">
													{new Date(label).toLocaleString()}
												</div>

												{payload.map((entry) => (
													<div
														key={entry.dataKey}
														className="flex items-center gap-2"
													>
														<span
															className="h-3 w-3 rounded-full"
															style={{ background: entry.color }}
														/>
														<span className="font-medium">
															{entry.dataKey}
														</span>
														<span>
															{Number(entry.value).toFixed(2)}
														</span>
													</div>
												))}
											</div>
										);
									}}
								/>

								{activeSymbols.map((symbol, i) => (
									<Line
										key={symbol}
										dataKey={symbol}
										yAxisId={symbol}
										name={symbol}
										type="monotone"
										stroke={`var(--chart-${(i % 6) + 1})`}
										strokeWidth={2}
										dot={false}
									/>
								))}
							</LineChart>
						</ChartContainer>
					</CardContent>
				</Card>
			</div>

			{/* Right section: 1/3 */}
			<div className="w-1/3 flex items-center justify-center flex flex-col px-3">
				<Holdings />
				<Button
					className="mt-5 w-50 text-base"
					onClick={() => {
						router.push('/trade');
					}}
				>
					Go Trading
				</Button>
			</div>
		</div>
	);
}

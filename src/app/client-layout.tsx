'use client';

import './globals.css';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { ChevronDownIcon, Slash } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SessionProvider, useSession } from 'next-auth/react';
// import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbEllipsis, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
// import { FileTree, type File } from '@/lib/file-types';
// import { PathProvider } from '@/lib/path-context';
// import { usePath } from '@/lib/path-context';
import { JSX } from 'react';
import { Toaster } from '@/components/ui/sonner';

export default function ClientLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <SessionProvider>
            <Layout>{children}</Layout>
            <Toaster richColors position="top-right" />
        </SessionProvider>
    );
}

function Layout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <main className="flex-1 min-h-screen overflow-hidden relative">
                <div className="flex items-center px-4 py-2">
                    <SidebarTrigger />
                </div>
                <div className="flex items-top justify-center min-h-full w-full">{children}</div>
            </main>
        </SidebarProvider>
    );
}

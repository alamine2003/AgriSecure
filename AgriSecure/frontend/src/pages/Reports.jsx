import React, { useState } from 'react';
import client from '../api/client';
import { Download } from 'lucide-react';
import { useMutation, useQuery } from "@tanstack/react-query"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { notify } from "@/lib/notify"

const Reports = () => {
    const [formData, setFormData] = useState({
        start_date: new Date(new Date().setDate(new Date().getDate()-7)).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        report_type: 'CSV'
    });

    const reportsQuery = useQuery({
        queryKey: ["reports"],
        queryFn: async () => {
            const res = await client.get("/reports/")
            return res.data
        },
    })

    const generateMutation = useMutation({
        mutationFn: async () => {
            await client.post("/reports/generate/", {
                start_date: new Date(formData.start_date).toISOString(),
                end_date: new Date(formData.end_date).toISOString(),
                report_type: formData.report_type,
                title: `Rapport ${new Date(formData.start_date).toLocaleDateString()} - ${new Date(formData.end_date).toLocaleDateString()}`,
            })
        },
        onSuccess: async () => {
            notify.success("Succès", "Rapport généré.")
            await reportsQuery.refetch()
        },
        onError: () => {
            notify.error("Erreur", "Échec de génération du rapport.")
        },
    })

    const handleGenerate = async (e) => {
        e.preventDefault();
        generateMutation.mutate()
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Rapports</h1>
                <p className="text-sm text-muted-foreground">
                    Générer et télécharger des exports.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1 lg:order-2">
                    <CardHeader>
                        <CardTitle>Générer</CardTitle>
                        <CardDescription>Période et format.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleGenerate} className="space-y-6">
                            <div className="space-y-3">
                                <Label htmlFor="start_date">Date de début</Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) =>
                                        setFormData({ ...formData, start_date: e.target.value })
                                    }
                                    required
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="end_date">Date de fin</Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) =>
                                        setFormData({ ...formData, end_date: e.target.value })
                                    }
                                    required
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="report_type">Format</Label>
                                <select
                                    id="report_type"
                                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground [color-scheme:dark] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.report_type}
                                    onChange={(e) =>
                                        setFormData({ ...formData, report_type: e.target.value })
                                    }
                                >
                                    <option value="CSV">CSV</option>
                                    <option value="PDF">PDF</option>
                                </select>
                            </div>

                            <Button type="submit" className="w-full mt-2 h-11" disabled={generateMutation.isPending}>
                                {generateMutation.isPending ? "Génération..." : "Générer le rapport"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 lg:order-1">
                    <CardHeader>
                        <CardTitle>Historique</CardTitle>
                        <CardDescription>Rapports disponibles au téléchargement.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {reportsQuery.isLoading ? (
                            <div className="text-sm text-muted-foreground">Chargement...</div>
                        ) : Array.isArray(reportsQuery.data) && reportsQuery.data.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-border text-xs text-muted-foreground">
                                        <tr>
                                            <th className="py-2 pr-4">Titre</th>
                                            <th className="py-2 pr-4">Créé le</th>
                                            <th className="py-2 pr-4">Format</th>
                                            <th className="py-2">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&>tr]:border-b [&>tr]:border-border/60">
                                        {reportsQuery.data.map((r, i) => (
                                            <tr key={i} className="hover:bg-secondary/30">
                                                <td className="py-3 pr-4">
                                                    {r.title}
                                                </td>
                                                <td className="py-3 pr-4">
                                                    {new Date(r.created_at).toLocaleString()}
                                                </td>
                                                <td className="py-3 pr-4">
                                                    <Badge variant="outline">{r.file_format}</Badge>
                                                </td>
                                                <td className="py-3">
                                                    <a
                                                        href={r.file_url || r.file_path}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 text-primary hover:underline"
                                                    >
                                                        <Download size={16} />
                                                        Télécharger
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground">Aucun rapport.</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Reports;

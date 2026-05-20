import React from 'react';
import client from '../api/client';
import CameraFeed from '../components/CameraFeed';
import { useQuery } from "@tanstack/react-query"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { notify } from "@/lib/notify"

const Surveillance = () => {
    const camerasQuery = useQuery({
        queryKey: ["cameras"],
        queryFn: async () => {
            const res = await client.get("/surveillance/cameras/")
            return res.data
        },
    })

    React.useEffect(() => {
        if (camerasQuery.error) notify.error("Erreur", "Impossible de charger les caméras.")
    }, [camerasQuery.error])

    const cameras = camerasQuery.data || []

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Surveillance</h1>
                <p className="text-sm text-muted-foreground">Flux caméra en direct.</p>
            </div>

            {camerasQuery.isLoading ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Caméras</CardTitle>
                        <CardDescription>Chargement...</CardDescription>
                    </CardHeader>
                </Card>
            ) : cameras.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    {cameras.map((cam) => (
                        <Card key={cam.id}>
                            <CardHeader className="space-y-1">
                                <CardTitle className="text-lg">{cam.name}</CardTitle>
                                <CardDescription>{cam.location}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <CameraFeed cameraId={cam.id} />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Caméras</CardTitle>
                        <CardDescription>Aucune caméra disponible.</CardDescription>
                    </CardHeader>
                </Card>
            )}
        </div>
    );
};

export default Surveillance;

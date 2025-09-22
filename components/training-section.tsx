"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dumbbell, Target, Timer, CheckCircle, Play, Pause, RotateCcw } from "lucide-react"

interface Exercise {
  id: string
  name: string
  equipment: string[]
  targetMuscles: string[]
  description: string
  instructions: string[]
  sets: number
  reps: string
  restTime: number
  difficulty: 'Principiant' | 'Intermedi' | 'Avançat'
  kitesurfBenefit: string
}

const exercises: Exercise[] = [
  {
    id: 'bosu-squat-kettlebell',
    name: 'Sentadilles en BOSU amb Kettlebell',
    equipment: ['BOSU', 'Kettlebell'],
    targetMuscles: ['Cuàdriceps', 'Glúteus', 'Core'],
    description: 'Simula la postura de kitesurf mentre fortaleix les cames i millora l\'equilibri.',
    instructions: [
      'Col·loca el BOSU amb la part plana cap avall',
      'Puja al BOSU amb els peus separats a l\'amplada dels malucs',
      'Agafa la kettlebell amb les dues mans al pit',
      'Baixa en sentadilla mantenint l\'equilibri',
      'Puja controlant el moviment'
    ],
    sets: 3,
    reps: '12-15',
    restTime: 60,
    difficulty: 'Intermedi',
    kitesurfBenefit: 'Millora la postura de navegació i la resistència de cames'
  },
  {
    id: 'bosu-lunges-elastic',
    name: 'Zancades en BOSU amb Goma Elàstica',
    equipment: ['BOSU', 'Goma elàstica'],
    targetMuscles: ['Cuàdriceps', 'Glúteus', 'Estabilitzadors'],
    description: 'Entrena l\'equilibri unilateral i la força funcional per salts i maniobres.',
    instructions: [
      'Col·loca un peu al centre del BOSU',
      'Subjecta la goma elàstica amb les mans',
      'Fes una zancada cap enrere amb l\'altra cama',
      'Baixa fins que el genoll quasi toqui terra',
      'Puja i repeteix abans de canviar de cama'
    ],
    sets: 3,
    reps: '10 cada cama',
    restTime: 45,
    difficulty: 'Avançat',
    kitesurfBenefit: 'Prepara per aterratges i canvis de direcció'
  },
  {
    id: 'chair-hip-bridge-elastic',
    name: 'Elevació de Maluc amb Cadira i Goma',
    equipment: ['Cadira', 'Goma elàstica'],
    targetMuscles: ['Glúteus', 'Isquiotibials', 'Core'],
    description: 'Fortaleix els glúteus per evitar fatiga i millorar la potència.',
    instructions: [
      'Seu a terra amb l\'esquena recolzada a la cadira',
      'Col·loca la goma elàstica sobre els malucs',
      'Peus plans a terra, genolls flexionats',
      'Eleva els malucs formant una línia recta',
      'Manté 2 segons i baixa controlat'
    ],
    sets: 3,
    reps: '15-20',
    restTime: 45,
    difficulty: 'Principiant',
    kitesurfBenefit: 'Evita dolors de cadera i millora la postura'
  },
  {
    id: 'kite-pull-elastic',
    name: 'Simulació de Tracció de Cometa',
    equipment: ['Goma elàstica', 'Cadira'],
    targetMuscles: ['Dorsals', 'Bíceps', 'Core'],
    description: 'Simula la tensió constant de la cometa per entrenar resistència específica.',
    instructions: [
      'Fixa la goma elàstica a la cadira',
      'Agafa els extrems amb les dues mans',
      'Posició de kitesurf: cames flexionades, esquena recta',
      'Tira de la goma simulant el control de la cometa',
      'Manté la tensió i controla el retorn'
    ],
    sets: 3,
    reps: '20-25',
    restTime: 60,
    difficulty: 'Intermedi',
    kitesurfBenefit: 'Millora la resistència dels braços i el control de la cometa'
  },
  {
    id: 'bosu-calf-raises',
    name: 'Elevacions de Talons en BOSU',
    equipment: ['BOSU'],
    targetMuscles: ['Bessons', 'Soli', 'Estabilitzadors'],
    description: 'Prevé calambres i millora l\'equilibri sobre la taula.',
    instructions: [
      'Puja al BOSU amb la part bombada cap amunt',
      'Peus junts al centre del BOSU',
      'Eleva els talons mantenint l\'equilibri',
      'Baixa controlat sense tocar amb els talons',
      'Manté la posició alta 1 segon'
    ],
    sets: 3,
    reps: '15-20',
    restTime: 30,
    difficulty: 'Principiant',
    kitesurfBenefit: 'Evita calambres i millora el control de la taula'
  },
  {
    id: 'kettlebell-core-twist',
    name: 'Rotacions de Core amb Kettlebell',
    equipment: ['Kettlebell'],
    targetMuscles: ['Oblics', 'Core', 'Estabilitzadors'],
    description: 'Fortaleix el core per maniobres de rotació i canvis de direcció.',
    instructions: [
      'Seu a terra amb cames flexionades',
      'Agafa la kettlebell amb les dues mans',
      'Inclina lleugerament l\'esquena cap enrere',
      'Rota el tronc d\'un costat a l\'altre',
      'La kettlebell ha de tocar terra a cada costat'
    ],
    sets: 3,
    reps: '20 (10 cada costat)',
    restTime: 45,
    difficulty: 'Intermedi',
    kitesurfBenefit: 'Millora les rotacions i canvis de direcció'
  }
]

const workoutPlans = [
  {
    name: 'Sessió Principiant',
    duration: '20-25 min',
    exercises: ['chair-hip-bridge-elastic', 'bosu-calf-raises', 'kite-pull-elastic'],
    description: 'Perfecta per començar a enfortir les bases'
  },
  {
    name: 'Sessió Intermèdia',
    duration: '30-35 min',
    exercises: ['bosu-squat-kettlebell', 'chair-hip-bridge-elastic', 'kite-pull-elastic', 'kettlebell-core-twist'],
    description: 'Equilibri entre força i resistència'
  },
  {
    name: 'Sessió Avançada',
    duration: '40-45 min',
    exercises: ['bosu-squat-kettlebell', 'bosu-lunges-elastic', 'kite-pull-elastic', 'kettlebell-core-twist', 'bosu-calf-raises'],
    description: 'Entrenament complet per riders experimentats'
  }
]

export function TrainingSection() {
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null)
  const [currentExercise, setCurrentExercise] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [completedSets, setCompletedSets] = useState<{[key: string]: number}>({})

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Principiant': return 'bg-green-100 text-green-800 border-green-200'
      case 'Intermedi': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Avançat': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEquipmentIcon = (equipment: string) => {
    const icons: {[key: string]: string} = {
      'BOSU': '⚪',
      'Kettlebell': '🏋️',
      'Cadira': '🪑',
      'Goma elàstica': '🔗'
    }
    return icons[equipment] || '🏃'
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Dumbbell className="mr-2 h-6 w-6 text-purple-600" />
          Entrenament Personal per Kitesurf
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Exercicis específics per reforçar cames i core amb el teu equipament disponible
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="exercises" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="exercises">Exercicis</TabsTrigger>
            <TabsTrigger value="workouts">Plans d'Entrenament</TabsTrigger>
            <TabsTrigger value="benefits">Beneficis</TabsTrigger>
          </TabsList>

          <TabsContent value="exercises" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exercises.map((exercise) => (
                <Card key={exercise.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{exercise.name}</CardTitle>
                      <Badge className={getDifficultyColor(exercise.difficulty)}>
                        {exercise.difficulty}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {exercise.equipment.map((eq) => (
                        <Badge key={eq} variant="outline" className="text-xs">
                          {getEquipmentIcon(eq)} {eq}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{exercise.description}</p>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Músculs:</span>
                        <span>{exercise.targetMuscles.join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Timer className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Sets/Reps:</span>
                        <span>{exercise.sets} x {exercise.reps}</span>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-3 mb-3">
                      <div className="text-xs font-medium text-blue-800 mb-1">Benefici per Kitesurf:</div>
                      <div className="text-xs text-blue-700">{exercise.kitesurfBenefit}</div>
                    </div>

                    <details className="text-sm">
                      <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                        Veure instruccions detallades
                      </summary>
                      <ol className="mt-2 space-y-1 text-xs text-gray-600 ml-4">
                        {exercise.instructions.map((instruction, index) => (
                          <li key={index} className="list-decimal">{instruction}</li>
                        ))}
                      </ol>
                    </details>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="workouts" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {workoutPlans.map((plan, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedWorkout(plan.name)}>
                  <CardHeader>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Timer className="h-4 w-4" />
                      {plan.duration}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                    <div className="text-xs">
                      <strong>Exercicis inclosos:</strong>
                      <ul className="mt-1 space-y-1">
                        {plan.exercises.map((exerciseId) => {
                          const exercise = exercises.find(e => e.id === exerciseId)
                          return (
                            <li key={exerciseId} className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              {exercise?.name}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedWorkout && (
              <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-purple-600" />
                    {selectedWorkout} - En Curs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-purple-800">
                    Pla d'entrenament seleccionat. Segueix els exercicis en ordre per obtenir els millors resultats.
                  </div>
                  <Button 
                    className="mt-3" 
                    onClick={() => setSelectedWorkout(null)}
                    variant="outline"
                  >
                    Canviar Pla
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="benefits" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    🦵 Beneficis per les Cames
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Resistència muscular</div>
                      <div className="text-xs text-muted-foreground">Sessions més llargues sense fatiga</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Estabilitat i equilibri</div>
                      <div className="text-xs text-muted-foreground">Millor control sobre la taula</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Prevenció de lesions</div>
                      <div className="text-xs text-muted-foreground">Genolls i turmells més forts</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    💪 Beneficis per el Core
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Potència de rotació</div>
                      <div className="text-xs text-muted-foreground">Maniobres més explosives</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Postura correcta</div>
                      <div className="text-xs text-muted-foreground">Menys dolor d'esquena</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Control de la cometa</div>
                      <div className="text-xs text-muted-foreground">Millor transmissió de força</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6 bg-gradient-to-r from-green-50 to-blue-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🎯 Recomanacions Generals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium mb-2">Freqüència d'Entrenament:</div>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• 3-4 sessions per setmana</li>
                      <li>• Descans de 48h entre sessions intenses</li>
                      <li>• Sessions lleugeres els dies de kitesurf</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium mb-2">Consells Importants:</div>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Escalfament de 5-10 minuts sempre</li>
                      <li>• Hidratació constant durant l'exercici</li>
                      <li>• Progressió gradual en intensitat</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
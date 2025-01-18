import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Calendar, 
  CheckCircle2, 
  Trash2, 
  Star, 
  Search,
  Tag,
  BarChart3,
  Edit2,
  X,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Objectif {
  id: number;
  titre: string;
  description: string;
  dateLimite: string;
  complete: boolean;
  priorite: boolean;
  categorie: string;
  dateCreation: string;
  dateDerniereModification?: string;
}

function App() {
  const [objectifs, setObjectifs] = useState<Objectif[]>(() => {
    const savedObjectifs = localStorage.getItem('objectifs');
    return savedObjectifs ? JSON.parse(savedObjectifs) : [];
  });
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [dateLimite, setDateLimite] = useState('');
  const [categorie, setCategorie] = useState('eventmaking');
  const [filtreActif, setFiltreActif] = useState<'tous' | 'actifs' | 'completes'>('tous');
  const [recherche, setRecherche] = useState('');
  const [objectifEnEdition, setObjectifEnEdition] = useState<Objectif | null>(null);
  const [showStats, setShowStats] = useState(true);
  const [triPar, setTriPar] = useState<'date' | 'priorite' | 'titre'>('date');
  const [triOrdre, setTriOrdre] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    localStorage.setItem('objectifs', JSON.stringify(objectifs));
  }, [objectifs]);

  const ajouterObjectif = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) return;

    if (objectifEnEdition) {
      setObjectifs(objectifs.map(obj => 
        obj.id === objectifEnEdition.id 
          ? {
              ...obj,
              titre,
              description,
              dateLimite,
              categorie,
              dateDerniereModification: new Date().toISOString()
            }
          : obj
      ));
      setObjectifEnEdition(null);
    } else {
      const nouvelObjectif: Objectif = {
        id: Date.now(),
        titre,
        description,
        dateLimite,
        complete: false,
        priorite: false,
        categorie,
        dateCreation: new Date().toISOString()
      };
      setObjectifs([...objectifs, nouvelObjectif]);
    }

    setTitre('');
    setDescription('');
    setDateLimite('');
    setCategorie('eventmaking');
  };

  const commencerEdition = (objectif: Objectif) => {
    setObjectifEnEdition(objectif);
    setTitre(objectif.titre);
    setDescription(objectif.description);
    setDateLimite(objectif.dateLimite);
    setCategorie(objectif.categorie);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const annulerEdition = () => {
    setObjectifEnEdition(null);
    setTitre('');
    setDescription('');
    setDateLimite('');
    setCategorie('personnel');
  };

  const toggleComplete = (id: number) => {
    setObjectifs(
      objectifs.map((obj) =>
        obj.id === id 
          ? { 
              ...obj, 
              complete: !obj.complete,
              dateDerniereModification: new Date().toISOString()
            } 
          : obj
      )
    );
  };

  const togglePriorite = (id: number) => {
    setObjectifs(
      objectifs.map((obj) =>
        obj.id === id 
          ? { 
              ...obj, 
              priorite: !obj.priorite,
              dateDerniereModification: new Date().toISOString()
            } 
          : obj
      )
    );
  };

  const supprimerObjectif = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) {
      setObjectifs(objectifs.filter((obj) => obj.id !== id));
    }
  };

  const objectifsTriesEtFiltres = objectifs
    .filter(obj => {
      if (filtreActif === 'actifs') return !obj.complete;
      if (filtreActif === 'completes') return obj.complete;
      return true;
    })
    .filter(obj => 
      obj.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      obj.description.toLowerCase().includes(recherche.toLowerCase())
    )
    .sort((a, b) => {
      switch (triPar) {
        case 'date':
          return triOrdre === 'asc'
            ? new Date(a.dateLimite).getTime() - new Date(b.dateLimite).getTime()
            : new Date(b.dateLimite).getTime() - new Date(a.dateLimite).getTime();
        case 'priorite':
          return triOrdre === 'asc'
            ? (a.priorite === b.priorite ? 0 : a.priorite ? 1 : -1)
            : (a.priorite === b.priorite ? 0 : a.priorite ? -1 : 1);
        case 'titre':
          return triOrdre === 'asc'
            ? a.titre.localeCompare(b.titre)
            : b.titre.localeCompare(a.titre);
        default:
          return 0;
      }
    });

  const stats = {
    total: objectifs.length,
    completes: objectifs.filter(obj => obj.complete).length,
    enCours: objectifs.filter(obj => !obj.complete).length,
    prioritaires: objectifs.filter(obj => obj.priorite).length,
    parCategorie: objectifs.reduce((acc: {[key: string]: number}, obj) => {
      acc[obj.categorie] = (acc[obj.categorie] || 0) + 1;
      return acc;
    }, {})
  };

  const derniers7Jours = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const donneesGraphique = {
    labels: derniers7Jours.map(date => 
      new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'Objectifs Complétés',
        data: derniers7Jours.map(date => 
          objectifs.filter(obj => 
            obj.complete && 
            new Date(obj.dateDerniereModification || obj.dateCreation).toISOString().split('T')[0] === date
          ).length
        ),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Nouveaux Objectifs',
        data: derniers7Jours.map(date => 
          objectifs.filter(obj => 
            new Date(obj.dateCreation).toISOString().split('T')[0] === date
          ).length
        ),
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const optionsGraphique = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Activité des 7 derniers jours'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  const getCategorieColor = (categorie: string) => {
    const colors: { [key: string]: string } = {
      eventmaking: 'bg-blue-100 text-blue-800',
      mapping: 'bg-purple-100 text-purple-800',
      code: 'bg-green-100 text-green-800',
      uidesign: 'bg-red-100 text-red-800'
    };
    return colors[categorie] || 'bg-gray-100 text-gray-800';
  };

  const getObjectifsUrgents = () => {
    const aujourdhui = new Date();
    return objectifs.filter(obj => {
      if (obj.complete) return false;
      const dateLimite = new Date(obj.dateLimite);
      const diffJours = Math.ceil((dateLimite.getTime() - aujourdhui.getTime()) / (1000 * 60 * 60 * 24));
      return diffJours <= 3 && diffJours >= 0;
    });
  };

  const objectifsUrgents = getObjectifsUrgents();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-indigo-900 mb-4">
            Gestionnaire d'Objectifs
          </h1>
          <p className="text-gray-600 text-lg">
            Organisez, suivez et accomplissez vos objectifs
          </p>
        </header>

        {objectifsUrgents.length > 0 && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-800 mb-2">
              <AlertCircle size={20} />
              <h2 className="font-semibold">Objectifs Urgents</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {objectifsUrgents.map(obj => (
                <div key={obj.id} className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">{obj.titre}</span>
                    <span className="text-sm text-red-600">
                      {new Date(obj.dateLimite).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire et Statistiques */}
          <div className="lg:col-span-1 space-y-6">
            <form onSubmit={ajouterObjectif} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {objectifEnEdition ? 'Modifier l\'objectif' : 'Nouvel Objectif'}
                </h2>
                {objectifEnEdition && (
                  <button
                    type="button"
                    onClick={annulerEdition}
                    className="text-gray-400 hover:text-gray-600"
                    title="Annuler l'édition"
                  >
                    <X size={24} />
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="titre" className="block text-sm font-medium text-gray-700 mb-1">
                    Titre
                  </label>
                  <input
                    type="text"
                    id="titre"
                    value={titre}
                    onChange={(e) => setTitre(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Entrez le titre de l'objectif"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                    placeholder="Décrivez votre objectif"
                  />
                </div>

                <div>
                  <label htmlFor="categorie" className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie
                  </label>
                  <select
                    id="categorie"
                    value={categorie}
                    onChange={(e) => setCategorie(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="event making">Event Making</option>
                    <option value="mapping">Mapping</option>
                    <option value="code">Code</option>
                    <option value="ui design">UI design</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date limite
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={dateLimite}
                    onChange={(e) => setDateLimite(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  {objectifEnEdition ? (
                    <>
                      <Edit2 size={20} />
                      Mettre à jour l'objectif
                    </>
                  ) : (
                    <>
                      <PlusCircle size={20} />
                      Ajouter l'objectif
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Statistiques */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Statistiques
                </h2>
                <BarChart3 className="text-indigo-600" />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <p className="text-sm text-indigo-600">Total</p>
                  <p className="text-2xl font-bold text-indigo-900">{stats.total}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">Complétés</p>
                  <p className="text-2xl font-bold text-green-900">{stats.completes}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-600">En cours</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.enCours}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600">Prioritaires</p>
                  <p className="text-2xl font-bold text-red-900">{stats.prioritaires}</p>
                </div>
              </div>
              <div className="mt-6">
                <Line data={donneesGraphique} options={optionsGraphique} />
              </div>
            </div>
          </div>

          {/* Liste des Objectifs */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex-1 w-full">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Rechercher des objectifs..."
                      value={recherche}
                      onChange={(e) => setRecherche(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFiltreActif('tous')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filtreActif === 'tous'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Tous
                  </button>
                  <button
                    onClick={() => setFiltreActif('actifs')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filtreActif === 'actifs'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Actifs
                  </button>
                  <button
                    onClick={() => setFiltreActif('completes')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filtreActif === 'completes'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Complétés
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-4 mb-4">
                <select
                  value={triPar}
                  onChange={(e) => setTriPar(e.target.value as 'date' | 'priorite' | 'titre')}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="date">Trier par date</option>
                  <option value="priorite">Trier par priorité</option>
                  <option value="titre">Trier par titre</option>
                </select>
                <button
                  onClick={() => setTriOrdre(triOrdre === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                >
                  {triOrdre === 'asc' ? '↑' : '↓'}
                </button>
              </div>

              <div className="space-y-4">
                {objectifsTriesEtFiltres.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">Aucun objectif trouvé</p>
                  </div>
                ) : (
                  objectifsTriesEtFiltres.map((objectif) => (
                    <div
                      key={objectif.id}
                      className={`bg-white border rounded-xl p-6 transition-all hover:shadow-md ${
                        objectif.complete ? 'opacity-75' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className={`text-xl font-semibold ${
                              objectif.complete ? 'line-through text-gray-500' : 'text-gray-900'
                            }`}>
                              {objectif.titre}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategorieColor(objectif.categorie)}`}>
                              {objectif.categorie}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-3">{objectif.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar size={16} className="mr-1" />
                              <span>
                                {new Date(objectif.dateLimite).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            {objectif.dateDerniereModification && (
                              <div className="flex items-center">
                                <Clock size={16} className="mr-1" />
                                <span>
                                  Modifié le {new Date(objectif.dateDerniereModification).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => commencerEdition(objectif)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
                            title="Modifier"
                          >
                            <Edit2 size={24} />
                          </button>
                          <button
                            onClick={() => togglePriorite(objectif.id)}
                            className={`p-2 rounded-full transition-colors ${
                              objectif.priorite
                                ? 'text-yellow-500 hover:text-yellow-600'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                            title="Marquer comme prioritaire"
                          >
                            <Star size={24} fill={objectif.priorite ? 'currentColor' : 'none'} />
                          </button>
                          <button
                            onClick={() => toggleComplete(objectif.id)}
                            className={`p-2 rounded-full transition-colors ${
                              objectif.complete
                                ? 'text-green-500 hover:text-green-600'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                            title="Marquer comme terminé"
                          >
                            <CheckCircle2 size={24} />
                          </button>
                          <button
                            onClick={() => supprimerObjectif(objectif.id)}
                            className="p-2 text-red-400 hover:text-red-600 rounded-full transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={24} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Plus,
  Trash2,
  Download,
  Eye,
  Building2,
  User,
  FileText,
  Calculator,
  MessageSquare,
  Upload,
  Loader2,
} from "lucide-react"

interface Item {
  id: number
  produto: string
  quantidade: number
  valor: number
}

interface DadosEmpresa {
  nome: string
  cnpj: string
  ie: string
  endereco: string
  cidade: string
  cep: string
  telefone: string
  email: string
  website: string
}

interface DadosCliente {
  nome: string
  telefone: string
  cpfCnpj: string
  email: string
  rgIe: string
  endereco: string
  bairro: string
  cidade: string
  estado: string
  cep: string
}

interface DadosOrcamento {
  numero: string
  data: string
  validadeAte: string
}

export default function GeradorOrcamento() {
  const [visualizando, setVisualizando] = useState(false)

  const [dadosEmpresa, setDadosEmpresa] = useState<DadosEmpresa>({
    nome: "",
    cnpj: "",
    ie: "",
    endereco: "",
    cidade: "",
    cep: "",
    telefone: "",
    email: "",
    website: "",
  })

  const [logoEmpresa, setLogoEmpresa] = useState<string>("")

  const [dadosCliente, setDadosCliente] = useState<DadosCliente>({
    nome: "",
    telefone: "",
    cpfCnpj: "",
    email: "",
    rgIe: "",
    endereco: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
  })

  const [dadosOrcamento, setDadosOrcamento] = useState<DadosOrcamento>({
    numero: "",
    data: new Date().toLocaleDateString("pt-BR"),
    validadeAte: "",
  })

  const [itens, setItens] = useState<Item[]>([{ id: 1, produto: "", quantidade: 1, valor: 0 }])

  const [desconto, setDesconto] = useState(0)
  const [acrescimo, setAcrescimo] = useState(0)
  const [observacoes, setObservacoes] = useState({
    formaPagamento: "",
    acrescimo: "",
    desconto: "",
    obs: "",
  })

  const [buscandoCepEmpresa, setBuscandoCepEmpresa] = useState(false)
  const [buscandoCepCliente, setBuscandoCepCliente] = useState(false)

  const adicionarItem = () => {
    const novoId = Math.max(...itens.map((item) => item.id)) + 1
    setItens([...itens, { id: novoId, produto: "", quantidade: 1, valor: 0 }])
  }

  const removerItem = (id: number) => {
    if (itens.length > 1) {
      setItens(itens.filter((item) => item.id !== id))
    }
  }

  const atualizarItem = (id: number, campo: keyof Item, valor: any) => {
    setItens(itens.map((item) => (item.id === id ? { ...item, [campo]: valor } : item)))
  }

  const calcularSubtotal = () => {
    return itens.reduce((total, item) => total + item.quantidade * item.valor, 0)
  }

  const calcularTotal = () => {
    const subtotal = calcularSubtotal()
    return subtotal - desconto + acrescimo
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoEmpresa(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const buscarCEP = async (cep: string, tipo: "empresa" | "cliente") => {
    const cepLimpo = cep.replace(/\D/g, "")

    if (cepLimpo.length !== 8) return

    const setBuscando = tipo === "empresa" ? setBuscandoCepEmpresa : setBuscandoCepCliente

    try {
      setBuscando(true)
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await response.json()

      if (data.erro) {
        alert("CEP não encontrado!")
        return
      }

      if (tipo === "empresa") {
        setDadosEmpresa((prev) => ({
          ...prev,
          cep: formatarCEP(cepLimpo),
          endereco: data.logradouro || prev.endereco,
          cidade: `${data.localidade} - ${data.uf}` || prev.cidade,
        }))
      } else {
        setDadosCliente((prev) => ({
          ...prev,
          cep: formatarCEP(cepLimpo),
          endereco: data.logradouro || prev.endereco,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
        }))
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
      alert("Erro ao buscar CEP. Tente novamente.")
    } finally {
      setBuscando(false)
    }
  }

  const formatarCEP = (cep: string) => {
    return cep.replace(/(\d{5})(\d{3})/, "$1-$2")
  }

  const handleCEPChange = (valor: string, tipo: "empresa" | "cliente") => {
    const cepFormatado = formatarCEP(valor.replace(/\D/g, ""))

    if (tipo === "empresa") {
      setDadosEmpresa((prev) => ({ ...prev, cep: cepFormatado }))
    } else {
      setDadosCliente((prev) => ({ ...dadosCliente, cep: cepFormatado }))
    }

    if (valor.replace(/\D/g, "").length === 8) {
      buscarCEP(valor, tipo)
    }
  }

  const salvarPDF = () => {
    // Define o nome do arquivo baseado no nome do cliente
    const nomeArquivo = dadosCliente.nome
      ? `Orcamento_${dadosCliente.nome.replace(/[^a-zA-Z0-9]/g, "_")}_${dadosOrcamento.numero || "SN"}`
      : `Orcamento_${dadosOrcamento.numero || new Date().getTime()}`

    // Temporariamente altera o título da página para o nome desejado do arquivo
    const tituloOriginal = document.title
    document.title = nomeArquivo

    // Executa a impressão
    window.print()

    // Restaura o título original após um pequeno delay
    setTimeout(() => {
      document.title = tituloOriginal
    }, 1000)
  }

  if (visualizando) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto p-4">
          <div className="no-print mb-6 flex gap-3">
            <Button onClick={() => setVisualizando(false)} variant="outline" className="shadow-sm">
              Voltar ao Editor
            </Button>
            <Button
              onClick={salvarPDF}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
            >
              <Download className="w-4 h-4" />
              Salvar PDF
            </Button>
          </div>

          <div
            className="bg-white border-2 border-black print:border-black shadow-2xl"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            {/* Cabeçalho */}
            <div className="border-b-2 border-black p-6 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-start gap-8 mb-4">
                {logoEmpresa ? (
                  <img
                    src={logoEmpresa || "/placeholder.svg"}
                    alt="Logo da empresa"
                    className="w-32 h-32 object-contain rounded-lg shadow-md flex-shrink-0"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <div className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-lg"></div>
                  </div>
                )}
                <div className="flex-1 text-center">
                  <h1 className="text-xl font-bold text-gray-800 mb-2">{dadosEmpresa.nome}</h1>
                  <p className="text-xs text-gray-600 mb-4">
                    CPF/CNPJ: {dadosEmpresa.cnpj} - IE: {dadosEmpresa.ie}
                  </p>
                  <div className="text-xs text-gray-700 space-y-1">
                    <p>{dadosEmpresa.endereco}</p>
                    <p>
                      {dadosEmpresa.cidade} - Cep: {dadosEmpresa.cep}
                    </p>
                    <p>Tel: {dadosEmpresa.telefone}</p>
                    <p>E-mail: {dadosEmpresa.email}</p>
                    <p>Website: {dadosEmpresa.website}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Informações do Orçamento */}
            <div className="border-b border-black p-3 flex bg-gray-50">
              <div className="flex-1 border-r border-black px-3">
                <strong className="text-gray-800 text-sm">Orçamento nº: {dadosOrcamento.numero}</strong>
              </div>
              <div className="flex-1 border-r border-black px-3">
                <strong className="text-gray-800 text-sm">Emitido em: {dadosOrcamento.data}</strong>
              </div>
              <div className="flex-1 px-3">
                <strong className="text-gray-800 text-sm">
                  Válida até:{" "}
                  {dadosOrcamento.validadeAte
                    ? new Date(dadosOrcamento.validadeAte + "T00:00:00").toLocaleDateString("pt-BR")
                    : "___/___/___"}
                </strong>
              </div>
            </div>

            {/* Cliente */}
            <div className="border-b border-black">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 text-center font-bold border-b border-black text-white">
                CLIENTE
              </div>
              <div className="p-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <strong className="text-gray-700 text-sm">NOME:</strong>{" "}
                    <span className="text-gray-900 text-sm">{dadosCliente.nome}</span>
                  </div>
                  <div>
                    <strong className="text-gray-700 text-sm">TELEFONE:</strong>{" "}
                    <span className="text-gray-900 text-sm">{dadosCliente.telefone}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <strong className="text-gray-700 text-sm">CPF/CNPJ:</strong>{" "}
                    <span className="text-gray-900 text-sm">{dadosCliente.cpfCnpj}</span>
                  </div>
                  <div>
                    <strong className="text-gray-700 text-sm">EMAIL:</strong>{" "}
                    <span className="text-gray-900 text-sm">{dadosCliente.email}</span>
                  </div>
                  <div>
                    <strong className="text-gray-700 text-sm">RG/IE:</strong>{" "}
                    <span className="text-gray-900 text-sm">{dadosCliente.rgIe}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 mb-3">
                  <div>
                    <strong className="text-gray-700 text-sm">ENDEREÇO:</strong>{" "}
                    <span className="text-gray-900 text-sm">{dadosCliente.endereco}</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <strong className="text-gray-700 text-sm">BAIRRO:</strong>{" "}
                    <span className="text-gray-900 text-sm">{dadosCliente.bairro}</span>
                  </div>
                  <div>
                    <strong className="text-gray-700 text-sm">CIDADE:</strong>{" "}
                    <span className="text-gray-900 text-sm">{dadosCliente.cidade}</span>
                  </div>
                  <div>
                    <strong className="text-gray-700 text-sm">ESTADO:</strong>{" "}
                    <span className="text-gray-900 text-sm">{dadosCliente.estado}</span>
                  </div>
                  <div>
                    <strong className="text-gray-700 text-sm">CEP:</strong>{" "}
                    <span className="text-gray-900 text-sm">{dadosCliente.cep}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Orçamento */}
            <div className="border-b border-black">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 p-3 text-center font-bold border-b border-black text-white">
                ORÇAMENTO
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-black bg-gray-100">
                    <th className="border-r border-black p-3 w-12 text-gray-700 text-sm">ITEM</th>
                    <th className="border-r border-black p-3 text-gray-700 text-sm">PRODUTO/SERVIÇO</th>
                    <th className="border-r border-black p-3 w-20 text-gray-700 text-sm">QUANT.</th>
                    <th className="p-3 w-24 text-gray-700 text-sm">VALOR</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item, index) => (
                    <tr key={item.id} className="border-b border-black hover:bg-gray-50">
                      <td className="border-r border-black p-3 text-center text-gray-800 text-sm">{index + 1}</td>
                      <td className="border-r border-black p-3 text-gray-800 text-sm">{item.produto}</td>
                      <td className="border-r border-black p-3 text-center text-gray-800 text-sm">{item.quantidade}</td>
                      <td className="p-3 text-right text-gray-800 text-sm font-medium text-sm">
                        R$ {item.valor.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 10 - itens.length) }).map((_, index) => (
                    <tr key={`empty-${index}`} className="border-b border-black">
                      <td className="border-r border-black p-3 h-10"></td>
                      <td className="border-r border-black p-3"></td>
                      <td className="border-r border-black p-3"></td>
                      <td className="p-3"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totais */}
            <div className="border-b border-black p-3 flex bg-gradient-to-r from-gray-100 to-gray-200">
              <div className="flex-1 border-r border-black px-3">
                <strong className="text-gray-800 text-sm">SUBTOTAL: R$ {calcularSubtotal().toFixed(2)}</strong>
              </div>
              <div className="flex-1 border-r border-black px-3">
                <strong className="text-red-600 text-sm">DESCONTO: R$ {desconto.toFixed(2)}</strong>
              </div>
              <div className="flex-1 border-r border-black px-3">
                <strong className="text-blue-600 text-sm">ACRÉSCIMO: R$ {acrescimo.toFixed(2)}</strong>
              </div>
              <div className="flex-1 px-3">
                <strong className="text-green-600 text-base">TOTAL: R$ {calcularTotal().toFixed(2)}</strong>
              </div>
            </div>

            {/* Observações */}
            <div className="border-b border-black">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 text-center font-bold border-b border-black text-white">
                OBSERVAÇÕES
              </div>
              <div className="p-6 text-xs space-y-2 bg-gray-50">
                {observacoes.formaPagamento && (
                  <p className="text-gray-700 text-xs">
                    <strong className="text-gray-800 text-xs">Forma de Pagamento:</strong> {observacoes.formaPagamento}
                  </p>
                )}
                {observacoes.acrescimo && (
                  <p className="text-gray-700 text-xs">
                    <strong className="text-gray-800 text-xs">Acréscimo:</strong> {observacoes.acrescimo}
                  </p>
                )}
                {observacoes.desconto && (
                  <p className="text-gray-700 text-xs">
                    <strong className="text-gray-800 text-xs">Desconto:</strong> {observacoes.desconto}
                  </p>
                )}
                {observacoes.obs && (
                  <p className="text-gray-700 text-xs">
                    <strong className="text-gray-800 text-xs">Obs:</strong> {observacoes.obs}
                  </p>
                )}
              </div>
            </div>

            {/* Rodapé */}
            <div className="p-6 flex justify-between bg-gray-50">
              <div className="text-center">
                <div className="border-t-2 border-gray-400 pt-3 w-64">
                  <strong className="text-gray-800 text-sm">{dadosEmpresa.nome}</strong>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-gray-400 pt-3 w-64">
                  <strong className="text-gray-800 text-sm">{dadosCliente.nome}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Gerador de Orçamento
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Crie orçamentos profissionais de forma rápida e elegante</p>

          <Button
            onClick={() => setVisualizando(true)}
            className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Eye className="w-5 h-5 mr-2" />
            Visualizar Orçamento
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Dados da Empresa */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Building2 className="w-6 h-6" />
                Dados da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nomeEmpresa" className="text-sm font-semibold text-gray-700">
                  Nome da Empresa
                </Label>
                <Input
                  id="nomeEmpresa"
                  value={dadosEmpresa.nome}
                  onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, nome: e.target.value })}
                  className="border-2 border-gray-200 focus:border-blue-500 rounded-lg transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoEmpresa" className="text-sm font-semibold text-gray-700">
                  Logo da Empresa
                </Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      id="logoEmpresa"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg cursor-pointer transition-colors"
                    />
                  </div>
                  <Upload className="w-5 h-5 text-gray-400" />
                </div>
                {logoEmpresa && (
                  <div className="mt-3 flex justify-center">
                    <img
                      src={logoEmpresa || "/placeholder.svg"}
                      alt="Preview do logo"
                      className="w-24 h-24 object-contain border-2 border-gray-200 rounded-lg shadow-md"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cnpj" className="text-sm font-semibold text-gray-700">
                    CNPJ
                  </Label>
                  <Input
                    id="cnpj"
                    value={dadosEmpresa.cnpj}
                    onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, cnpj: e.target.value })}
                    className="border-2 border-gray-200 focus:border-blue-500 rounded-lg transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ie" className="text-sm font-semibold text-gray-700">
                    IE
                  </Label>
                  <Input
                    id="ie"
                    value={dadosEmpresa.ie}
                    onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, ie: e.target.value })}
                    className="border-2 border-gray-200 focus:border-blue-500 rounded-lg transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="enderecoEmpresa" className="text-sm font-semibold text-gray-700">
                  Endereço
                </Label>
                <Input
                  id="enderecoEmpresa"
                  value={dadosEmpresa.endereco}
                  onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, endereco: e.target.value })}
                  className="border-2 border-gray-200 focus:border-blue-500 rounded-lg transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidadeEmpresa" className="text-sm font-semibold text-gray-700">
                    Cidade
                  </Label>
                  <Input
                    id="cidadeEmpresa"
                    value={dadosEmpresa.cidade}
                    onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, cidade: e.target.value })}
                    className="border-2 border-gray-200 focus:border-blue-500 rounded-lg transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cepEmpresa" className="text-sm font-semibold text-gray-700">
                    CEP
                  </Label>
                  <div className="relative">
                    <Input
                      id="cepEmpresa"
                      value={dadosEmpresa.cep}
                      onChange={(e) => handleCEPChange(e.target.value, "empresa")}
                      placeholder="00000-000"
                      maxLength={9}
                      className="border-2 border-gray-200 focus:border-blue-500 rounded-lg transition-colors pr-10"
                    />
                    {buscandoCepEmpresa && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefoneEmpresa" className="text-sm font-semibold text-gray-700">
                  Telefone
                </Label>
                <Input
                  id="telefoneEmpresa"
                  value={dadosEmpresa.telefone}
                  onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, telefone: e.target.value })}
                  className="border-2 border-gray-200 focus:border-blue-500 rounded-lg transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailEmpresa" className="text-sm font-semibold text-gray-700">
                  E-mail
                </Label>
                <Input
                  id="emailEmpresa"
                  value={dadosEmpresa.email}
                  onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, email: e.target.value })}
                  className="border-2 border-gray-200 focus:border-blue-500 rounded-lg transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="text-sm font-semibold text-gray-700">
                  Website
                </Label>
                <Input
                  id="website"
                  value={dadosEmpresa.website}
                  onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, website: e.target.value })}
                  className="border-2 border-gray-200 focus:border-blue-500 rounded-lg transition-colors"
                />
              </div>
            </CardContent>
          </Card>

          {/* Dados do Cliente */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <User className="w-6 h-6" />
                Dados do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nomeCliente" className="text-sm font-semibold text-gray-700">
                  Nome
                </Label>
                <Input
                  id="nomeCliente"
                  value={dadosCliente.nome}
                  onChange={(e) => setDadosCliente({ ...dadosCliente, nome: e.target.value })}
                  className="border-2 border-gray-200 focus:border-green-500 rounded-lg transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefoneCliente" className="text-sm font-semibold text-gray-700">
                    Telefone
                  </Label>
                  <Input
                    id="telefoneCliente"
                    value={dadosCliente.telefone}
                    onChange={(e) => setDadosCliente({ ...dadosCliente, telefone: e.target.value })}
                    className="border-2 border-gray-200 focus:border-green-500 rounded-lg transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailCliente" className="text-sm font-semibold text-gray-700">
                    E-mail
                  </Label>
                  <Input
                    id="emailCliente"
                    value={dadosCliente.email}
                    onChange={(e) => setDadosCliente({ ...dadosCliente, email: e.target.value })}
                    className="border-2 border-gray-200 focus:border-green-500 rounded-lg transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpfCnpjCliente" className="text-sm font-semibold text-gray-700">
                    CPF/CNPJ
                  </Label>
                  <Input
                    id="cpfCnpjCliente"
                    value={dadosCliente.cpfCnpj}
                    onChange={(e) => setDadosCliente({ ...dadosCliente, cpfCnpj: e.target.value })}
                    className="border-2 border-gray-200 focus:border-green-500 rounded-lg transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rgIeCliente" className="text-sm font-semibold text-gray-700">
                    RG/IE
                  </Label>
                  <Input
                    id="rgIeCliente"
                    value={dadosCliente.rgIe}
                    onChange={(e) => setDadosCliente({ ...dadosCliente, rgIe: e.target.value })}
                    className="border-2 border-gray-200 focus:border-green-500 rounded-lg transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="enderecoCliente" className="text-sm font-semibold text-gray-700">
                  Endereço
                </Label>
                <Input
                  id="enderecoCliente"
                  value={dadosCliente.endereco}
                  onChange={(e) => setDadosCliente({ ...dadosCliente, endereco: e.target.value })}
                  className="border-2 border-gray-200 focus:border-green-500 rounded-lg transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bairroCliente" className="text-sm font-semibold text-gray-700">
                    Bairro
                  </Label>
                  <Input
                    id="bairroCliente"
                    value={dadosCliente.bairro}
                    onChange={(e) => setDadosCliente({ ...dadosCliente, bairro: e.target.value })}
                    className="border-2 border-gray-200 focus:border-green-500 rounded-lg transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidadeCliente" className="text-sm font-semibold text-gray-700">
                    Cidade
                  </Label>
                  <Input
                    id="cidadeCliente"
                    value={dadosCliente.cidade}
                    onChange={(e) => setDadosCliente({ ...dadosCliente, cidade: e.target.value })}
                    className="border-2 border-gray-200 focus:border-green-500 rounded-lg transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estadoCliente" className="text-sm font-semibold text-gray-700">
                    Estado
                  </Label>
                  <Input
                    id="estadoCliente"
                    value={dadosCliente.estado}
                    onChange={(e) => setDadosCliente({ ...dadosCliente, estado: e.target.value })}
                    className="border-2 border-gray-200 focus:border-green-500 rounded-lg transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cepCliente" className="text-sm font-semibold text-gray-700">
                    CEP
                  </Label>
                  <div className="relative">
                    <Input
                      id="cepCliente"
                      value={dadosCliente.cep}
                      onChange={(e) => handleCEPChange(e.target.value, "cliente")}
                      placeholder="00000-000"
                      maxLength={9}
                      className="border-2 border-gray-200 focus:border-green-500 rounded-lg transition-colors pr-10"
                    />
                    {buscandoCepCliente && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Orçamento */}
          <Card className="mt-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <FileText className="w-6 h-6" />
                Informações do Orçamento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="numeroOrcamento" className="text-sm font-semibold text-gray-700">
                    Número do Orçamento
                  </Label>
                  <Input
                    id="numeroOrcamento"
                    value={dadosOrcamento.numero}
                    onChange={(e) => setDadosOrcamento({ ...dadosOrcamento, numero: e.target.value })}
                    className="border-2 border-gray-200 focus:border-purple-500 rounded-lg transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataOrcamento" className="text-sm font-semibold text-gray-700">
                    Data
                  </Label>
                  <Input
                    id="dataOrcamento"
                    value={dadosOrcamento.data}
                    onChange={(e) => setDadosOrcamento({ ...dadosOrcamento, data: e.target.value })}
                    className="border-2 border-gray-200 focus:border-purple-500 rounded-lg transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validadeAte" className="text-sm font-semibold text-gray-700">
                    Válida até
                  </Label>
                  <Input
                    id="validadeAte"
                    type="date"
                    value={dadosOrcamento.validadeAte}
                    onChange={(e) => setDadosOrcamento({ ...dadosOrcamento, validadeAte: e.target.value })}
                    className="border-2 border-gray-200 focus:border-purple-500 rounded-lg transition-colors"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Itens do Orçamento */}
          <Card className="mt-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Calculator className="w-6 h-6" />
                  Itens do Orçamento
                </CardTitle>
                <Button
                  onClick={adicionarItem}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-lg transition-all duration-200"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {itens.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-4 items-end p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200"
                  >
                    <div className="col-span-1">
                      <Label className="text-sm font-semibold text-gray-700">Item</Label>
                      <div className="h-10 flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <div className="col-span-6">
                      <Label className="text-sm font-semibold text-gray-700">Produto/Serviço</Label>
                      <Input
                        value={item.produto}
                        onChange={(e) => atualizarItem(item.id, "produto", e.target.value)}
                        placeholder="Descrição do produto ou serviço"
                        className="border-2 border-gray-200 focus:border-orange-500 rounded-lg transition-colors"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-sm font-semibold text-gray-700">Quantidade</Label>
                      <Input
                        type="number"
                        value={item.quantidade}
                        onChange={(e) => atualizarItem(item.id, "quantidade", Number.parseInt(e.target.value) || 0)}
                        min="1"
                        className="border-2 border-gray-200 focus:border-orange-500 rounded-lg transition-colors"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-sm font-semibold text-gray-700">Valor (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.valor}
                        onChange={(e) => atualizarItem(item.id, "valor", Number.parseFloat(e.target.value) || 0)}
                        min="0"
                        className="border-2 border-gray-200 focus:border-orange-500 rounded-lg transition-colors"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removerItem(item.id)}
                        disabled={itens.length === 1}
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-8" />

              {/* Totais */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Subtotal</Label>
                  <div className="h-12 flex items-center px-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg font-bold text-gray-800 text-xs overflow-hidden">
                    <span className="truncate">R$ {calcularSubtotal().toFixed(2)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desconto" className="text-sm font-semibold text-gray-700">
                    Desconto (R$)
                  </Label>
                  <Input
                    id="desconto"
                    type="number"
                    step="0.01"
                    value={desconto}
                    onChange={(e) => setDesconto(Number.parseFloat(e.target.value) || 0)}
                    min="0"
                    className="border-2 border-gray-200 focus:border-red-500 rounded-lg transition-colors h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="acrescimo" className="text-sm font-semibold text-gray-700">
                    Acréscimo (R$)
                  </Label>
                  <Input
                    id="acrescimo"
                    type="number"
                    step="0.01"
                    value={acrescimo}
                    onChange={(e) => setAcrescimo(Number.parseFloat(e.target.value) || 0)}
                    min="0"
                    className="border-2 border-gray-200 focus:border-blue-500 rounded-lg transition-colors h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Total</Label>
                  <div className="h-12 flex items-center px-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold text-sm shadow-lg overflow-hidden">
                    <span className="truncate">R$ {calcularTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card className="mt-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <MessageSquare className="w-6 h-6" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="formaPagamento" className="text-sm font-semibold text-gray-700">
                  Forma de Pagamento
                </Label>
                <Textarea
                  id="formaPagamento"
                  value={observacoes.formaPagamento}
                  onChange={(e) => setObservacoes({ ...observacoes, formaPagamento: e.target.value })}
                  placeholder="Ex: Pagamento em Dinheiro, sendo 50% no início e restante na entrega."
                  className="border-2 border-gray-200 focus:border-indigo-500 rounded-lg transition-colors min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acrescimoObs" className="text-sm font-semibold text-gray-700">
                  Acréscimo
                </Label>
                <Textarea
                  id="acrescimoObs"
                  value={observacoes.acrescimo}
                  onChange={(e) => setObservacoes({ ...observacoes, acrescimo: e.target.value })}
                  placeholder="Ex: R$ 100,00 - Por ser domingo de noite."
                  className="border-2 border-gray-200 focus:border-indigo-500 rounded-lg transition-colors min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descontoObs" className="text-sm font-semibold text-gray-700">
                  Desconto
                </Label>
                <Textarea
                  id="descontoObs"
                  value={observacoes.desconto}
                  onChange={(e) => setObservacoes({ ...observacoes, desconto: e.target.value })}
                  placeholder="Ex: R$ 50,00 - Desconto para pagamento adiantado em Dinheiro."
                  className="border-2 border-gray-200 focus:border-indigo-500 rounded-lg transition-colors min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="obsGerais" className="text-sm font-semibold text-gray-700">
                  Observações Gerais
                </Label>
                <Textarea
                  id="obsGerais"
                  value={observacoes.obs}
                  onChange={(e) => setObservacoes({ ...observacoes, obs: e.target.value })}
                  placeholder="Ex: Previsão de entrega: 30 dias úteis."
                  className="border-2 border-gray-200 focus:border-indigo-500 rounded-lg transition-colors min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

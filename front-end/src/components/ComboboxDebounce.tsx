import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { JSX, useEffect, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import SpinnerLoading from "./SpinnerLoading";
import { fetchUseQuery } from "@/api/services/fetchUseQuery";

interface ComboboxAPIProps<T> {
  route: string;
  queryKey: string; // queryKey como parâmetro
  dataField?: string;
  selecionado: T | T[] | undefined;
  setSelecionado: (value: T | T[] | undefined) => void;
  placeholderInputSearch: string;
  placeholderUnselected: string;
  multipleOption?: boolean;
  visualizacao: string | undefined;
  selectedField: (selecionado: T) => string;
  renderOption: (dados: T) => JSX.Element;
  disabled?: boolean;
  removeOneOption?: boolean;
}

export default function ComboboxDebounce<T>({
  route,
  queryKey, // recebendo o queryKey
  dataField,
  selecionado,
  setSelecionado,
  placeholderInputSearch,
  placeholderUnselected,
  multipleOption = false,
  selectedField,
  renderOption,
  visualizacao,
  disabled = false,
  removeOneOption = false,
}: ComboboxAPIProps<T>) {

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [shouldFetchInitial, setShouldFetchInitial] = useState<boolean>(true);

  useEffect(() => {
    if (!open) return;

    // Faz a busca inicial apenas uma vez
    if (shouldFetchInitial) {
      setSearchTerm(""); // busca vazia
      setShouldFetchInitial(false); // evita repetição
    }
  }, [open, shouldFetchInitial]);

  useEffect(() => {
    const trimmed = inputValue.trim();

    // Se tiver menos de 3 letras, limpa o termo de busca (ou nem busca)
    if (trimmed.length < 3) {
      setSearchTerm(""); // Garante que não busque nada
      return;
    }

    // Se tiver 3 letras ou mais, faz o debounce normalmente
    const timer = setTimeout(() => {
      setSearchTerm(trimmed);
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue]);

  // Usando useQuery do React Query
  const { data: response, isLoading } = useQuery({
    queryKey: [queryKey, route, searchTerm],
    queryFn: async () => {
      if (!route) return [];

      const res = await fetchUseQuery<undefined, any>({
        route: `${route}=${searchTerm}`,
        method: "GET",
        nextOptions: {},
      });

      // Se o usuário passou o nome do campo
      if (dataField && res?.[dataField]) {
        return res[dataField] as T[];
      }

      // Se o retorno JÁ é um array, apenas retorna
      if (Array.isArray(res)) {
        return res as T[];
      }

      return [];
    },
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const selectOption = (option: T) => {
    if (multipleOption) {
      const currentSelecionado = Array.isArray(selecionado) ? selecionado : [];
      if (!currentSelecionado.some(item => selectedField(item) === selectedField(option))) {
        setSelecionado([...currentSelecionado, option]);
      }
    } else {
      setSelecionado(option);
      setOpen(false);
    }
  };

  const removeOption = (option: T) => {
    if (multipleOption) {
      setSelecionado(
        (selecionado as T[]).filter((item) => selectedField(item) !== selectedField(option))
      );
    } else {
      setSelecionado(undefined);
      setOpen(false);
    }
  };

  const findOption = (dados: T): boolean => {
    if (!selecionado) return false;

    if (multipleOption) {
      return Array.isArray(selecionado) ? selecionado.some((item) => selectedField(item) === selectedField(dados)) : false;
    } else {
      return !Array.isArray(selecionado) && selectedField(selecionado) === selectedField(dados);
    }
  };

  return (
    <Popover open={disabled ? false : open} onOpenChange={disabled ? () => { } : setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="flex w-full p-1 px-3 min-h-9 h-auto justify-between items-center overflow-hidden"
        >
          <div className="flex-grow">
            {Array.isArray(selecionado) && selecionado.length > 0 ? (
              // Se o valor selecionado é maior que 1 mostra apenas a quantidade e não o valor selecionado 
              <div className="max-h-5 flex flex-wrap gap-2">
                {selecionado.length > 1 ? (
                  <div className="flex items-center pl-2 pr-5 py-1 bg-gray-900 rounded">
                    <span className="font-semibold text-sm">
                      {selecionado.length} itens selecionados
                    </span>
                  </div>
                ) : (
                  selecionado.map((item) => (
                    <div
                      key={selectedField(item)}
                      className="flex items-center pl-2 pr-5 py-1 bg-gray-900 rounded"
                    >
                      <span className="font-semibold text-sm">
                        {selectedField(item)}
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label="Remover opção"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeOption(item);
                        }}
                      >
                        <X className="hover:text-white" />
                      </span>
                    </div>
                  ))
                )}
              </div>
            ) : selecionado && !Array.isArray(selecionado) ? (
              <div
                className={cn(
                  "flex items-center pl-2 pr-5 py-1 bg-gray-900 rounded",
                  removeOneOption && "cursor-pointer hover:bg-slate-300"
                )}
                role={removeOneOption ? "button" : undefined}
                tabIndex={removeOneOption ? 0 : undefined}
                onClick={(e) => {
                  if (!removeOneOption) return;
                  e.stopPropagation();
                  removeOption(selecionado);
                }}
              >
                <span className="font-semibold text-sm">
                  {visualizacao && visualizacao.trim() !== ""
                    ? visualizacao
                    : selectedField(selecionado)}
                </span>

                {removeOneOption && (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="Remover opção"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOption(selecionado);
                    }}
                  >
                    <X className="ml-2 h-4 w-4 hover:text-white" />
                  </span>
                )}
              </div>
            ) : (
              <span>{placeholderUnselected}</span>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <div className="flex items-center gap-1 py-2 px-2 border-b border-zinc-300">
            <Search className="w-[16px] text-zinc-400" />
            <input type="text" className="w-full focus:outline-none text-sm p-1"
              placeholder={placeholderInputSearch} value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              // autoFocus
              autoComplete="off" />
          </div>
          {isLoading && <CommandItem><SpinnerLoading /></CommandItem>}
          {!isLoading && response?.length === 0 && <CommandEmpty>Nenhum resultado encontrado!</CommandEmpty>}
          <CommandList>
            <CommandGroup>
              {response?.map((dados) => (
                <CommandItem key={(dados as any).id || selectedField(dados)} onSelect={() => findOption(dados) ? removeOption(dados) : selectOption(dados)}>
                  <Check className={cn("mr-2 h-4 w-4", findOption(dados) ? "opacity-100" : "opacity-0")} />
                  {renderOption(dados)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
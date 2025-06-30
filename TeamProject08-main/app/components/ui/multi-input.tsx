import * as React from "react";
import multiIcon from "~/assets/icons/select.svg";
import Select, {
  components,
  DropdownIndicatorProps,
  InputProps,
  MultiValueGenericProps,
  MultiValueRemoveProps,
  ClearIndicatorProps,
} from "react-select";
import { Separator } from "./separator";
import { CrossIcon } from "~/assets/icons/cross";

const DropdownIndicator = (props: DropdownIndicatorProps<unknown>) => {
  return (
    <components.DropdownIndicator {...props}>
      <img src={multiIcon} />
    </components.DropdownIndicator>
  );
};

const CustomOption = ({
  innerProps,
  isDisabled,
  label,
}: {
  innerProps: React.HTMLAttributes<HTMLDivElement>;
  isDisabled: boolean;
  label: string;
}) =>
  !isDisabled ? (
    <>
      <span
        {...innerProps}
        className="my-0.5 flex h-8 cursor-pointer items-center justify-between rounded-md px-1 first:mt-0 hover:bg-gray-100 [&:nth-last-child(2)]:mb-0"
      >
        {label}
      </span>
      <Separator className="mx-1 w-auto last:absolute last:hidden last:max-h-0" />
    </>
  ) : null;

const MultiValueLabel = (props: MultiValueGenericProps) => {
  return (
    <components.MultiValueLabel {...props}>
      {props.data.label}
    </components.MultiValueLabel>
  );
};

const MultiValueRemove = (props: MultiValueRemoveProps) => {
  return (
    <components.MultiValueRemove {...props}>
      <CrossIcon className="h-3 w-3" />
    </components.MultiValueRemove>
  );
};

const ClearIndicator = (props: ClearIndicatorProps<unknown>) => {
  const {
    children,
    innerProps: { ref, ...restInnerProps },
  } = props;
  return (
    <div {...restInnerProps} ref={ref}>
      <div className="flex h-5 w-5 cursor-pointer rounded-full bg-gray-200 transition hover:bg-gray-300">
        <CrossIcon className="m-auto h-3 w-3" />
      </div>
    </div>
  );
};

const MultiInput = ({ className, options, ...props }: InputProps) => {
  return (
    <div className={className}>
      <Select
        {...props}
        options={options}
        components={{
          DropdownIndicator,
          Option: CustomOption,
          MultiValueLabel,
          MultiValueRemove,
          ClearIndicator,
        }}
        isMulti
        closeMenuOnSelect={false}
        classNames={{
          menu: (state) =>
            "font-medium shadow !rounded-mmd border-white bg-white !px-1",
          multiValue: (state) =>
            "!bg-dray-50 border-gray-200 border !rounded-lg !py-0.5 !pl-2 !pr-1 !m-0.5",
          multiValueLabel: (state) => "!p-0 !leading-4 !font-medium",
          multiValueRemove: (state) =>
            "!p-0 !bg-transparent !shadow-none !px-1",
          container: (state) =>
            "shadow-sa shadowHover rounded-lg text-sm h-auto min-h-8",
          control: (state) =>
            "!border !border-black/5 !rounded-lg !min-h-7 !h-full !shadow-none",
          placeholder: (state) => "!text-black/40",
          indicatorsContainer: (state) => "!h-fit !m-auto",
          indicatorSeparator: (state) => "!h-0",
          dropdownIndicator: (state) => "!p-0 !pr-1",
          group: (state) =>
            "shadow-sa shadowHover relative flex h-full w-full items-center justify-center rounded-lg border border-black/5 py-1 pl-3 pr-1 text-sm outline-none file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-black/40 focus-visible:outline-none rtl:pl-1 rtl:pr-0",
        }}
      />
    </div>
  );
};

export { MultiInput };

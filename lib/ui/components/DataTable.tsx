/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * @oncall npe_central_engineering
 */

import {Octicons} from '@expo/vector-icons';
import {Opt} from '@toolkit/core/util/Types';
import {useTextInput} from '@toolkit/ui/UiHooks';
import React, {useState} from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';
import {
  Button,
  DataTable as PaperDataTable,
  IconButton,
  Text,
} from 'react-native-paper';

type ButtonCellProps = CellProps & {
  onPress: () => void;
  icon?: string;
  label?: string;
};

const ButtonCell = ({onPress, icon, label, style}: ButtonCellProps) => {
  const {Cell} = PaperDataTable;

  // Override rn-paper default margins
  // Remove horizontal margins on icon-less buttons so button text aligns with column header
  const labelStyle = icon == null ? {marginHorizontal: 0} : {};
  // Reverse the 12px horizontal margin on icons so icon aligns with column header
  const contentStyle = icon != null ? {marginHorizontal: -12} : {};

  const button =
    icon != null && label == null ? (
      <IconButton onPress={onPress} icon={icon} />
    ) : (
      <Button
        mode="outlined"
        onPress={onPress}
        icon={icon}
        labelStyle={labelStyle}
        contentStyle={contentStyle}>
        {label}
      </Button>
    );
  return <Cell style={style}>{button}</Cell>;
};

type EditableTextCellProps = CellProps & {
  value: string;
  onSubmit?: (newValue: string) => void;
};

export const EditableTextCell = ({
  value,
  onSubmit,
  style,
}: EditableTextCellProps) => {
  const {Cell} = PaperDataTable;
  const [TextInput, text, setText] = useTextInput(value);
  const [editable, setEditable] = React.useState(false);
  const [numOfLines, setNumOfLines] = React.useState(value.split('\n').length);
  return (
    <Cell
      style={[S.cell, style]}
      onPress={() => {
        setEditable(true);
      }}>
      <TextInput
        editable={editable}
        style={editable ? S.editable : {}}
        multiline={true}
        numberOfLines={numOfLines}
        onKeyPress={() => {
          setNumOfLines(text.split('\n').length);
        }}
      />
      {editable && (
        <>
          <IconButton
            icon="check-circle"
            onPress={() => {
              onSubmit && onSubmit(text);
              setEditable(false);
            }}
          />
          <IconButton
            icon="close-circle"
            onPress={() => {
              setText(value);
              setEditable(false);
            }}
          />
        </>
      )}
    </Cell>
  );
};

export type RowProps = {
  children: React.ReactElement<CellProps>[];
};

const Row = (props: RowProps) => {
  return <PaperDataTable.Row>{props.children}</PaperDataTable.Row>;
};

type TextCellProps = CellProps & {
  value: string;
  verified?: Opt<boolean>;
};

const TextCell = ({value, verified, style}: TextCellProps) => {
  let icon =
    verified == null ? null : (
      <Octicons
        name={verified ? 'verified' : 'unverified'}
        size={20}
        color={verified ? 'green' : 'gray'}
        style={{marginRight: 7}}
      />
    );

  return (
    <View style={[S.container, style]}>
      {icon}
      <Text>{value}</Text>
    </View>
  );
};

const S = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cell: {
    flex: 1,
  },
  editable: {
    borderBottomWidth: 1,
  },
});

export type SortOrder = 'ascending' | 'descending';
export type CellProps = {
  title: string;
  style?: ViewStyle;
  onSort?: (order: SortOrder) => void;
};

type Props = {
  style?: ViewStyle;
  children: React.ReactElement<RowProps>[];
};

/**
 * DataTable component for admin pages.
 *
 * This is going to rapidly change as we build the admin panel. Once there's a
 * stable enough version of this, we should move it to @npe/lib/paper
 */
export default function DataTable({children: rows, style}: Props) {
  const {Title, Header} = PaperDataTable;
  const [sortColKey, setSortColKey] = useState<string>();
  const [sortOrder, setSortOrder] = useState<SortOrder>('descending');

  // TODO: Better empty state
  if (rows.length === 0) {
    return <Text>No data available for this table</Text>;
  }

  const headers = rows[0].props.children.map((cell, i) => {
    const {title, style, onSort} = cell.props;
    const key = title + i;
    return (
      <Title
        key={key}
        style={style}
        sortDirection={sortColKey === key ? sortOrder : undefined}
        onPress={() => {
          if (onSort == null) {
            return;
          }
          const order = sortOrder == 'ascending' ? 'descending' : 'ascending';
          onSort(order);
          setSortColKey(key);
          setSortOrder(order);
        }}>
        {title}
      </Title>
    );
  });

  return (
    <View style={[{flex: 1}, style]}>
      <PaperDataTable>
        <Header>{headers}</Header>
        {rows}
      </PaperDataTable>
    </View>
  );
}

DataTable.Row = Row;
DataTable.TextCell = TextCell;
DataTable.ButtonCell = ButtonCell;
DataTable.EditableTextCell = EditableTextCell;
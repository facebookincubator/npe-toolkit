/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useState} from 'react';
import {Pressable, StyleProps, StyleSheet, View, ViewStyle} from 'react-native';
import {Octicons} from '@expo/vector-icons';
import {
  Button,
  IconButton,
  DataTable as PaperDataTable,
  Text,
} from 'react-native-paper';
import {Opt} from '@toolkit/core/util/Types';
import {useTextInput} from '@toolkit/ui/UiHooks';

type ButtonCellProps = CellProps & {
  onPress: () => void;
  icon?: string;
  label?: string;
  labelStyle?: StyleProps<ViewStyle>;
};

const ButtonCell = ({
  onPress,
  icon,
  label,
  style,
  labelStyle,
}: ButtonCellProps) => {
  const {Cell} = PaperDataTable;

  // Override rn-paper default margins
  // Remove horizontal margins on icon-less buttons so button text aligns with column header
  const labelMargin = icon == null ? {marginHorizontal: 0} : {};
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
        labelStyle={[labelMargin, labelStyle]}
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
  onPress?: () => void | Promise<void>;
  children: React.ReactElement<CellProps>[];
};

const Row = (props: RowProps) => {
  return <PaperDataTable.Row {...props} />;
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

export type SortOrder = 'asc' | 'desc';
export type SortState = {col: string; order: SortOrder};
export type CellProps = {
  title: string;
  style?: ViewStyle;
  onSort?: (sortState: SortState) => void;
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
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // TODO: Better empty state
  if (rows.length === 0) {
    return <Text>No data available for this table</Text>;
  }

  function onHeaderPress(props: CellProps, key: string) {
    const {title, onSort} = props;
    if (onSort == null) {
      return;
    }
    const order = sortOrder == 'asc' ? 'desc' : 'asc';
    onSort({col: title, order});
    setSortColKey(key);
    setSortOrder(order);
  }

  const headers = rows[0].props.children.map((cell, i) => {
    const {title, style, onSort} = cell.props;
    const key = title + i;
    return (
      <Title
        key={key}
        style={style}
        sortDirection={
          sortColKey === key
            ? sortOrder === 'asc'
              ? 'ascending'
              : 'descending'
            : undefined
        }>
        <Pressable onPress={() => onHeaderPress(cell.props, key)}>
          <Text>{title}</Text>
        </Pressable>
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

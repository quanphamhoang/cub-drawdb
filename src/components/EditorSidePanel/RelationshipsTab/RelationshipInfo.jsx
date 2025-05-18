import {
  Row,
  Col,
  Select,
  Button,
  Popover,
  Table,
  Input,
  Checkbox,
} from "@douyinfe/semi-ui";
import {
  IconDeleteStroked,
  IconLoopTextStroked,
  IconMore,
} from "@douyinfe/semi-icons";
import {
  Cardinality,
  Constraint,
  Action,
  ObjectType,
} from "../../../data/constants";
import { useDiagram, useUndoRedo } from "../../../hooks";
import i18n from "../../../i18n/i18n";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

const columns = [
  {
    title: i18n.t("from"),
    dataIndex: "from",
  },
  {
    title: i18n.t("to"),
    dataIndex: "to",
  },
];

export default function RelationshipInfo({ data }) {
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { tables, setRelationships, deleteRelationship, updateRelationship } =
    useDiagram();
  const { t } = useTranslation();
  const [editField, setEditField] = useState({});
  const [isMultiple, setIsMultiple] = useState(data.name.includes("(1:n)"));

  useEffect(() => {
    if (data.cardinality === Cardinality.TWO_WAY) {
      setIsMultiple(true);
    } else {
      setIsMultiple(data.name.includes("(1:n)"));
    }
  }, [data.cardinality, data.name]);

  const swapKeys = () => {
    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        element: ObjectType.RELATIONSHIP,
        rid: data.id,
        undo: {
          startTableId: data.startTableId,
          startFieldId: data.startFieldId,
          endTableId: data.endTableId,
          endFieldId: data.endFieldId,
        },
        redo: {
          startTableId: data.endTableId,
          startFieldId: data.endFieldId,
          endTableId: data.startTableId,
          endFieldId: data.startFieldId,
        },
        message: t("edit_relationship", {
          refName: data.name,
          extra: "[swap keys]",
        }),
      },
    ]);
    setRedoStack([]);
    setRelationships((prev) =>
      prev.map((e, idx) =>
        idx === data.id
          ? {
              ...e,
              name: t(e.cardinality),
              startTableId: e.endTableId,
              startFieldId: e.endFieldId,
              endTableId: e.startTableId,
              endFieldId: e.startFieldId,
            }
          : e,
      ),
    );
  };

  const changeCardinality = (value) => {
    const isTwoWay = value === Cardinality.TWO_WAY;
    const isRefLookup = value === Cardinality.REF_LOOKUP;
    const newIsMultiple = isTwoWay ? true : false;
    setIsMultiple(newIsMultiple);
    
    let newName;
    if (isTwoWay) {
      newName = "2-way (n:n)";
    } else if (isRefLookup) {
      newName = "ref-lookup";
    } else {
      newName = newIsMultiple ? "1-way (1:n)" : "1-way (1:1)";
    }
    
    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        element: ObjectType.RELATIONSHIP,
        rid: data.id,
        undo: { cardinality: data.cardinality, name: data.name },
        redo: { 
          cardinality: value,
          name: newName
        },
        message: t("edit_relationship", {
          refName: data.name,
          extra: "[cardinality]",
        }),
      },
    ]);
    setRedoStack([]);
    setRelationships((prev) =>
      prev.map((e, idx) =>
        idx === data.id ? { 
          ...e, 
          cardinality: value,
          name: newName
        } : e,
      ),
    );
  };

  const handleMultipleChange = (checked) => {
    if (data.cardinality === Cardinality.TWO_WAY || data.cardinality === Cardinality.REF_LOOKUP) return;
    
    setIsMultiple(checked);
    const newName = checked ? "1-way (1:n)" : "1-way (1:1)";
    
    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        element: ObjectType.RELATIONSHIP,
        rid: data.id,
        undo: { name: data.name },
        redo: { name: newName },
        message: t("edit_relationship", {
          refName: newName,
          extra: "[multiple]",
        }),
      },
    ]);
    setRedoStack([]);
    setRelationships((prev) =>
      prev.map((e, idx) =>
        idx === data.id ? { ...e, name: newName } : e,
      ),
    );
  };

  const changeConstraint = (key, value) => {
    const undoKey = `${key}Constraint`;
    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        element: ObjectType.RELATIONSHIP,
        rid: data.id,
        undo: { [undoKey]: data[undoKey] },
        redo: { [undoKey]: value },
        message: t("edit_relationship", {
          refName: data.name,
          extra: "[constraint]",
        }),
      },
    ]);
    setRedoStack([]);
    setRelationships((prev) =>
      prev.map((e, idx) => (idx === data.id ? { ...e, [undoKey]: value } : e)),
    );
  };

  return (
    <>
      <div className="flex items-center mb-2.5">
        <div className="text-md font-semibold break-keep">{t("name")}: </div>
        <Input
          value={data.name}
          validateStatus={data.name.trim() === "" ? "error" : "default"}
          placeholder={t("name")}
          className="ms-2"
          onChange={(value) => updateRelationship(data.id, { name: value })}
          onFocus={(e) => setEditField({ name: e.target.value })}
          onBlur={(e) => {
            if (e.target.value === editField.name) return;
            setUndoStack((prev) => [
              ...prev,
              {
                action: Action.EDIT,
                element: ObjectType.RELATIONSHIP,
                component: "self",
                rid: data.id,
                undo: editField,
                redo: { name: e.target.value },
                message: t("edit_relationship", {
                  refName: e.target.value,
                  extra: "[name]",
                }),
              },
            ]);
            setRedoStack([]);
          }}
        />
      </div>
      <div className="flex justify-between items-center mb-3">
        <div className="me-3">
          <span className="font-semibold">{t("from")}: </span>
          {tables[data.endTableId].name}
        </div>
        <div className="mx-1">
          <span className="font-semibold">{t("to")}: </span>
          {tables[data.startTableId].name}
        </div>
        <div className="ms-1">
          <Popover
            content={
              <div className="p-2 popover-theme">
                <Table
                  columns={columns}
                  dataSource={[
                    {
                      key: "1",
                      foreign: `${tables[data.startTableId]?.name}(${
                        tables[data.startTableId].fields[data.startFieldId]
                          ?.name
                      })`,
                      primary: `${tables[data.endTableId]?.name}(${
                        tables[data.endTableId].fields[data.endFieldId]?.name
                      })`,
                    },
                  ]}
                  pagination={false}
                  size="small"
                  bordered
                />
                <div className="mt-2">
                  <Button
                    icon={<IconLoopTextStroked />}
                    block
                    onClick={swapKeys}
                  >
                    {t("swap")}
                  </Button>
                </div>
              </div>
            }
            trigger="click"
            position="rightTop"
            showArrow
          >
            <Button icon={<IconMore />} type="tertiary" />
          </Popover>
        </div>
      </div>
      <div className="font-semibold my-1">{t("cardinality")}:</div>
      <Select
        optionList={Object.values(Cardinality).map((v) => ({
          label: t(v),
          value: v,
        }))}
        value={data.cardinality}
        className="w-full"
        onChange={changeCardinality}
      />
      <div className="mt-2">
        <Checkbox
          checked={isMultiple}
          disabled={data.cardinality === Cardinality.TWO_WAY || data.cardinality === Cardinality.REF_LOOKUP}
          onChange={handleMultipleChange}
        >
          {t("multiple_selection")}
        </Checkbox>
      </div>
      <Row gutter={6} className="my-3">
        <Col span={12}>
          <div className="font-semibold">{t("on_update")}: </div>
          <Select
            optionList={Object.values(Constraint).map((v) => ({
              label: v,
              value: v,
            }))}
            value={data.updateConstraint}
            className="w-full"
            onChange={(value) => changeConstraint("update", value)}
          />
        </Col>
        <Col span={12}>
          <div className="font-semibold">{t("on_delete")}: </div>
          <Select
            optionList={Object.values(Constraint).map((v) => ({
              label: v,
              value: v,
            }))}
            value={data.deleteConstraint}
            className="w-full"
            onChange={(value) => changeConstraint("delete", value)}
          />
        </Col>
      </Row>
      <Button
        icon={<IconDeleteStroked />}
        block
        type="danger"
        onClick={() => deleteRelationship(data.id)}
      >
        {t("delete")}
      </Button>
    </>
  );
}
